# King of War - Technical Design Document

## 1. System Overview

### 1.1 Architecture
King of War is a browser-based multiplayer board game using a client-server architecture:

```
┌─────────────────────┐     WebSocket      ┌──────────────────────────┐
│  React Frontend     │◄──────────────────►│  Cloudflare Workers       │
│  (Cloudflare Pages) │                     │  + Durable Objects        │
│                     │                     │  (Game Room per DO)       │
│  - Game Board UI    │   JSON messages     │  - Game state machine     │
│  - Card hand        │   (actions/state)   │  - Turn validation        │
│  - Combat overlay   │                     │  - AI logic               │
│  - Lobby/Chat       │                     │  - Fog of war filtering   │
└─────────────────────┘                     └──────────────────────────┘
```

**Key principle**: Server-authoritative. All game logic (dice rolls, combat, card effects, economy) runs on the Durable Object. The client is a display layer that sends action intents and renders server state.

### 1.2 Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI components, game screens |
| Build | Vite | Fast dev server and build |
| Styling | Tailwind CSS | Military theme, responsive layout |
| Client State | Zustand | Local UI state, server state mirror |
| Board Render | SVG + CSS | Board tiles, pieces, animations |
| Backend | Cloudflare Workers | HTTP API (lobby list, room creation) |
| Game Rooms | Cloudflare Durable Objects | Per-room stateful game engine + WebSocket |
| Deployment | Cloudflare Pages + Workers | Global edge CDN |

### 1.3 Project Structure
```
king-of-war/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── board/         # Board, Tile, CommanderPiece
│   │   │   ├── cards/         # CardHand, CardDetail, CardPlayOverlay
│   │   │   ├── combat/        # CombatOverlay, DiceRoll, BattleResult
│   │   │   ├── hud/           # PlayerPanel, TurnIndicator, Timer
│   │   │   ├── lobby/         # CreateRoom, JoinRoom, WaitingRoom
│   │   │   ├── modals/        # BuyLand, BuildStructure, Recruit, Sell
│   │   │   └── screens/       # LandingPage, GameScreen, VictoryScreen
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useGameState.ts
│   │   │   └── useAnimations.ts
│   │   ├── stores/
│   │   │   └── gameStore.ts   # Zustand store
│   │   ├── types/
│   │   │   └── game.ts        # Shared type definitions
│   │   ├── utils/
│   │   │   ├── boardLayout.ts # Tile positions, Classic/Blitz configs
│   │   │   └── constants.ts   # Game balance numbers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── assets/            # Card art, icons, fonts
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                    # Cloudflare Workers backend
│   ├── src/
│   │   ├── index.ts           # Worker entry: HTTP routes
│   │   ├── gameRoom.ts        # Durable Object: game engine
│   │   ├── gameState.ts       # State machine & transitions
│   │   ├── combat.ts          # Combat resolution logic
│   │   ├── cards.ts           # Card effect implementations
│   │   ├── ai.ts              # AI opponent logic
│   │   ├── boardConfig.ts     # Classic & Blitz board definitions
│   │   ├── validation.ts      # Action validation
│   │   └── types.ts           # Server-side types
│   ├── wrangler.toml
│   └── tsconfig.json
├── shared/                    # Shared between client & server
│   └── types.ts               # GameState, Player, Tile, Unit, Card types
│   └── constants.ts           # Balance values, board configs
└── package.json
```

---

## 2. Data Model

### 2.1 Core Types (shared/types.ts)

```typescript
// === GAME STATE ===
interface GameState {
  id: string;
  mode: "classic" | "blitz";
  status: "waiting" | "playing" | "ended";
  phase: "movement" | "action" | "management" | "combat";
  currentPlayerIndex: number;
  turnNumber: number;
  doublesRolled: boolean;
  lastDiceRoll: [number, number] | null;
  players: Player[];
  board: Tile[];
  cardDeck: string[];        // card IDs (server-side order)
  discardPile: string[];
  combatState: CombatState | null;
  settings: GameSettings;
  winner: string | null;     // player ID
}

interface GameSettings {
  playerCount: number;       // 2-4
  mode: "classic" | "blitz";
  turnTimer: number;         // seconds: 30, 60, 90, 0 (unlimited)
  isPrivate: boolean;
  roomCode: string;
}

// === PLAYER ===
interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  coins: number;
  position: number;          // tile index
  previousPosition: number;  // for retreat
  ownedTerritories: number[];
  reservePool: Unit[];
  mobileArmy: Unit[];
  hand: Card[];              // only sent to owning player
  isAI: boolean;
  isEliminated: boolean;
  isConnected: boolean;
  revealedGarrisons: number[]; // tile indices revealed by Military Investigation
  stats: PlayerStats;
}

type PlayerColor = "red" | "blue" | "yellow" | "green";

interface PlayerStats {
  battlesWon: number;
  battlesLost: number;
  territoriesCaptured: number;
  coinsEarned: number;
  unitsRecruited: number;
}

// === TILE ===
interface Tile {
  index: number;
  name: string;
  type: TileType;
  purchaseCost: number | null;
  rentBase: number | null;
  buildingLevel: 0 | 1 | 2 | 3;
  buildCosts: [number, number, number]; // cost for level 1, 2, 3
  owner: string | null;
  garrison: Unit[];
  hasFuseMine: boolean;      // placed by Fuse Mine card
  fuseMineOwner: string | null;
}

type TileType = "territory" | "supply_station" | "ammo_draw" | "recruitment" | "tax";

// === UNIT ===
interface Unit {
  id: string;
  type: UnitType;
  combatPower: number;
}

type UnitType = "infantry" | "tank" | "aircraft";

// === CARD ===
interface Card {
  id: string;
  type: CardType;
  timing: "combat" | "instant" | "defense" | "movement";
  name: string;
  description: string;
}

type CardType =
  | "mercenary"
  | "dummy_supplies"
  | "fuse_mine"
  | "land_tax"
  | "war_fund"
  | "surprise_attack"
  | "surrounded"
  | "transport_aircraft"
  | "repressive"
  | "military_investigation"
  | "mobilisation_of_militia";

// === COMBAT ===
interface CombatState {
  attackerId: string;
  defenderId: string;
  tileIndex: number;
  phase: "card_play" | "dice_roll" | "resolution";
  attackerCards: Card[];      // cards played
  defenderCards: Card[];
  attackerDice: number[] | null;
  defenderDice: number[] | null;
  attackerTotal: number | null;
  defenderTotal: number | null;
  result: "attacker_wins" | "defender_wins" | null;
  attackerLosses: Unit[];
  defenderLosses: Unit[];
}
```

### 2.2 Client View State

The server sends a **filtered view** to each player. The key filtering:

```typescript
// Server creates per-player view
function createPlayerView(state: GameState, playerId: string): ClientGameState {
  return {
    ...state,
    cardDeck: state.cardDeck.length,  // only count, not contents
    players: state.players.map(p => ({
      ...p,
      hand: p.id === playerId ? p.hand : p.hand.length, // only own hand visible
    })),
    board: state.board.map(tile => ({
      ...tile,
      garrison: shouldRevealGarrison(tile, playerId, state)
        ? tile.garrison
        : tile.garrison.length > 0 ? "hidden" : [],
      hasFuseMine: tile.fuseMineOwner === playerId ? tile.hasFuseMine : false,
    })),
  };
}

function shouldRevealGarrison(tile: Tile, playerId: string, state: GameState): boolean {
  // Own territory
  if (tile.owner === playerId) return true;
  // Revealed by Military Investigation
  const player = state.players.find(p => p.id === playerId);
  if (player?.revealedGarrisons.includes(tile.index)) return true;
  // During active combat on this tile
  if (state.combatState?.tileIndex === tile.index) return true;
  return false;
}
```

---

## 3. Backend Design (Durable Objects)

### 3.1 Worker Entry Point (server/src/index.ts)

Routes:
- `GET /api/rooms` — list public rooms (waiting status)
- `POST /api/rooms` — create room → returns room ID
- `GET /api/rooms/:id/ws` — WebSocket upgrade → proxied to Durable Object
- `GET /` — serve static frontend (Cloudflare Pages handles this)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      const settings = await request.json<GameSettings>();
      const roomId = crypto.randomUUID();
      // Create Durable Object stub
      const id = env.GAME_ROOM.idFromName(roomId);
      const room = env.GAME_ROOM.get(id);
      await room.fetch(new Request("https://internal/init", {
        method: "POST",
        body: JSON.stringify({ roomId, settings }),
      }));
      return Response.json({ roomId, roomCode: settings.roomCode });
    }

    if (url.pathname.startsWith("/api/rooms/") && url.pathname.endsWith("/ws")) {
      const roomId = url.pathname.split("/")[3];
      const id = env.GAME_ROOM.idFromName(roomId);
      const room = env.GAME_ROOM.get(id);
      return room.fetch(request);
    }

    if (url.pathname === "/api/rooms" && request.method === "GET") {
      // List public rooms via KV or DO listing
      // Implementation: iterate known rooms or use KV index
    }

    return new Response("Not found", { status: 404 });
  },
};
```

### 3.2 Game Room Durable Object (server/src/gameRoom.ts)

Each game room is a single Durable Object that:
1. Holds the authoritative `GameState`
2. Manages WebSocket connections for all players
3. Processes action messages, validates, updates state, broadcasts
4. Runs AI turns

```typescript
export class GameRoom implements DurableObject {
  state: DurableObjectState;
  gameState: GameState | null = null;
  connections: Map<string, WebSocket> = new Map(); // playerId → ws

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/init") {
      const { roomId, settings } = await request.json();
      this.gameState = createInitialState(roomId, settings);
      await this.state.storage.put("gameState", this.gameState);
      return new Response("OK");
    }

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      // Player ID from query param or assigned
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const action = JSON.parse(message) as GameAction;
    const result = this.processAction(action);
    if (result.error) {
      ws.send(JSON.stringify({ type: "error", message: result.error }));
      return;
    }
    // Broadcast updated state to all players (filtered per player)
    this.broadcastState();
    // Check if next player is AI
    this.maybeRunAITurn();
  }

  processAction(action: GameAction): { error?: string } {
    // Validate action against current state
    // Update gameState
    // Return success or error
  }

  broadcastState() {
    for (const [playerId, ws] of this.connections) {
      const view = createPlayerView(this.gameState!, playerId);
      ws.send(JSON.stringify({ type: "state_update", state: view }));
    }
  }

  async maybeRunAITurn() {
    const currentPlayer = this.gameState!.players[this.gameState!.currentPlayerIndex];
    if (currentPlayer.isAI && !currentPlayer.isEliminated) {
      // Delay for natural feel
      await new Promise(r => setTimeout(r, 1500));
      const aiActions = computeAITurn(this.gameState!, currentPlayer.id);
      for (const action of aiActions) {
        this.processAction(action);
        this.broadcastState();
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
```

### 3.3 Game State Machine (server/src/gameState.ts)

Turn flow as a state machine:

```
WAITING → PLAYING (when host starts)

Per turn cycle:
  MOVEMENT → ACTION → MANAGEMENT → END_TURN
                ↓ (if combat triggered)
              COMBAT → (card_play → dice_roll → resolution) → ACTION continues

  END_TURN → check doubles → MOVEMENT (same player) or next player's MOVEMENT

  Any point → BANKRUPTCY check → ELIMINATION → VICTORY check
```

Action handlers:

```typescript
type GameAction =
  | { type: "join"; playerId: string; playerName: string }
  | { type: "start_game" }
  | { type: "roll_dice" }
  | { type: "buy_territory" }
  | { type: "pass_buy" }
  | { type: "build"; tileIndex: number }
  | { type: "recruit"; unitType: UnitType; count: number }
  | { type: "deploy_mobile"; unitIds: string[] }
  | { type: "deploy_garrison"; unitIds: string[]; tileIndex: number }
  | { type: "transfer_to_garrison"; unitIds: string[] }
  | { type: "transfer_to_mobile"; unitIds: string[] }
  | { type: "sell_territory"; tileIndex: number }
  | { type: "play_card"; cardId: string; target?: number | string }
  | { type: "combat_choice"; choice: "military" | "costly" | "retreat" }
  | { type: "combat_play_card"; cardId: string }
  | { type: "combat_ready" }   // done playing cards
  | { type: "leave_garrison"; unitIds: string[] }
  | { type: "end_management" }
  | { type: "chat"; message: string }
  | { type: "discard_card"; cardId: string };

function processAction(state: GameState, action: GameAction): GameState {
  // 1. Validate action is legal in current phase
  // 2. Validate it's the current player's turn (except combat defender actions)
  // 3. Apply state changes
  // 4. Check for phase transitions
  // 5. Check for bankruptcy/elimination/victory
  return updatedState;
}
```

### 3.4 Combat Resolution (server/src/combat.ts)

```typescript
function resolveCombat(state: GameState): GameState {
  const combat = state.combatState!;
  const attacker = state.players.find(p => p.id === combat.attackerId)!;
  const defender = state.players.find(p => p.id === combat.defenderId)!;
  const tile = state.board[combat.tileIndex];

  // Calculate attacker total
  let attackerDiceCount = 2;
  if (combat.attackerCards.some(c => c.type === "surprise_attack")) attackerDiceCount = 3;
  const attackerDice = rollDice(attackerDiceCount);
  const attackerUnitPower = sumCombatPower(attacker.mobileArmy);
  const attackerCardBonus = calcCardBonus(combat.attackerCards);
  const attackerTotal = sum(attackerDice) + attackerUnitPower + attackerCardBonus;

  // Calculate defender total
  const defenderDice = rollDice(2);
  const defenderUnitPower = sumCombatPower(tile.garrison);
  const defenderCardBonus = calcCardBonus(combat.defenderCards);
  let defenderTotal = sum(defenderDice) + defenderUnitPower + defenderCardBonus;

  // Fuse Mine: attacker takes -2
  if (tile.hasFuseMine) {
    defenderTotal += 2; // effectively -2 for attacker
    tile.hasFuseMine = false;
    tile.fuseMineOwner = null;
  }

  // Determine winner (defender wins ties)
  const result = attackerTotal > defenderTotal ? "attacker_wins" : "defender_wins";

  // Calculate losses
  const diff = Math.abs(attackerTotal - defenderTotal);
  const lossCount = diff <= 3 ? 1 : diff <= 6 ? 2 : Infinity;
  const loserUnits = result === "attacker_wins" ? tile.garrison : attacker.mobileArmy;
  const losses = removeWeakestUnits(loserUnits, lossCount);

  return {
    ...state,
    combatState: {
      ...combat,
      phase: "resolution",
      attackerDice,
      defenderDice: [defenderDice[0], defenderDice[1]],
      attackerTotal,
      defenderTotal,
      result,
      attackerLosses: result === "defender_wins" ? losses : [],
      defenderLosses: result === "attacker_wins" ? losses : [],
    },
  };
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function removeWeakestUnits(units: Unit[], count: number): Unit[] {
  // Sort by combat power ascending, remove `count` weakest
  const sorted = [...units].sort((a, b) => a.combatPower - b.combatPower);
  return sorted.splice(0, Math.min(count, sorted.length));
}
```

### 3.5 Card Effects (server/src/cards.ts)

```typescript
function applyCard(state: GameState, playerId: string, cardId: string, target?: number | string): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const card = player.hand.find(c => c.id === cardId)!;

  switch (card.type) {
    case "war_fund":
      player.coins += 4;
      break;

    case "land_tax":
      player.coins += player.ownedTerritories.length * 2;
      break;

    case "transport_aircraft": {
      const targetTile = target as number;
      player.previousPosition = player.position;
      player.position = targetTile;
      // Trigger landing actions (buy/rent/combat) handled by state machine
      break;
    }

    case "repressive": {
      const targetPlayer = state.players.find(p => p.id === target)!;
      targetPlayer.coins = Math.max(0, targetPlayer.coins - 5);
      break;
    }

    case "military_investigation": {
      const tileIndex = target as number;
      player.revealedGarrisons.push(tileIndex);
      break;
    }

    case "mobilisation_of_militia":
      player.reservePool.push(
        createUnit("infantry"),
        createUnit("infantry"),
      );
      break;

    case "fuse_mine": {
      const tileIndex = target as number;
      state.board[tileIndex].hasFuseMine = true;
      state.board[tileIndex].fuseMineOwner = playerId;
      break;
    }

    // Combat cards handled in combat resolution
    case "mercenary":
    case "dummy_supplies":
    case "surprise_attack":
    case "surrounded":
      // Added to combatState.attackerCards or defenderCards
      break;
  }

  // Remove card from hand, add to discard
  player.hand = player.hand.filter(c => c.id !== cardId);
  state.discardPile.push(cardId);
  return state;
}
```

---

## 4. Frontend Design

### 4.1 Screen Routing

```typescript
// App.tsx - simple state-based routing (no router needed)
function App() {
  const screen = useGameStore(s => s.screen);

  switch (screen) {
    case "landing": return <LandingPage />;
    case "lobby": return <LobbyScreen />;
    case "waiting": return <WaitingRoom />;
    case "game": return <GameScreen />;
    case "victory": return <VictoryScreen />;
  }
}
```

### 4.2 Game Screen Layout

```typescript
function GameScreen() {
  return (
    <div className="h-screen flex flex-col bg-army-dark">
      {/* Header: turn info, timer, phase */}
      <GameHeader />

      <div className="flex-1 flex">
        {/* Left: Player panels */}
        <PlayerPanelSidebar />

        {/* Center: Game board */}
        <GameBoard />

        {/* Right: Selected tile details */}
        <TileDetailPanel />
      </div>

      {/* Bottom: Card hand, action buttons, chat */}
      <BottomBar />

      {/* Overlays */}
      <CombatOverlay />
      <BuyLandModal />
      <BuildModal />
      <RecruitModal />
      <HowToPlayPanel />
    </div>
  );
}
```

### 4.3 Board Component (SVG)

The board is rendered as an SVG with tiles positioned in a rectangular loop (like Monopoly):

```typescript
function GameBoard() {
  const board = useGameStore(s => s.board);
  const players = useGameStore(s => s.players);
  const selectedTile = useGameStore(s => s.selectedTile);

  // Classic: 20 tiles in rectangular loop (5 per side)
  // Blitz: 10 tiles in smaller loop
  const layout = useBoardLayout(board);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <svg viewBox="0 0 800 800" className="max-h-full max-w-full">
        {/* Board background */}
        <BoardBackground />

        {/* Tiles */}
        {layout.map(({ tile, x, y, width, height, rotation }) => (
          <TileComponent
            key={tile.index}
            tile={tile}
            x={x} y={y}
            width={width} height={height}
            rotation={rotation}
            isSelected={selectedTile === tile.index}
            onClick={() => selectTile(tile.index)}
          />
        ))}

        {/* Commander pieces */}
        {players.filter(p => !p.isEliminated).map(player => (
          <CommanderPiece
            key={player.id}
            player={player}
            position={layout[player.position]}
          />
        ))}

        {/* Center area: dice, turn info */}
        <BoardCenter />
      </svg>
    </div>
  );
}
```

### 4.4 Tile Component

```typescript
function TileComponent({ tile, x, y, width, height, isSelected, onClick }: TileProps) {
  const currentPlayerId = useGameStore(s => s.myPlayerId);
  const ownerColor = tile.owner
    ? useGameStore(s => s.players.find(p => p.id === tile.owner)?.color)
    : null;

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} className="cursor-pointer">
      {/* Tile background */}
      <rect
        width={width} height={height}
        fill={getTileFill(tile.type)}
        stroke={ownerColor ? colorMap[ownerColor] : "#555"}
        strokeWidth={ownerColor ? 3 : 1}
        rx={4}
      />

      {/* Tile name */}
      <text x={width/2} y={16} textAnchor="middle" className="text-xs fill-cream">
        {tile.name}
      </text>

      {/* Cost */}
      {tile.purchaseCost && (
        <text x={width/2} y={height-8} textAnchor="middle" className="text-xs fill-gold">
          {tile.purchaseCost} coins
        </text>
      )}

      {/* Building indicators */}
      {tile.buildingLevel > 0 && <BuildingIcons level={tile.buildingLevel} x={4} y={24} />}

      {/* Garrison indicator */}
      {tile.owner && tile.owner !== currentPlayerId && tile.garrison === "hidden" && (
        <text x={width-12} y={24} className="text-sm fill-red">?</text>
      )}

      {/* Selection highlight */}
      {isSelected && (
        <rect width={width} height={height} fill="none" stroke="#d4a847" strokeWidth={2} rx={4} />
      )}
    </g>
  );
}
```

### 4.5 Combat Overlay

```typescript
function CombatOverlay() {
  const combat = useGameStore(s => s.combatState);
  if (!combat) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-army-dark border-2 border-gold p-8 rounded-lg max-w-4xl w-full">
        <h2 className="text-2xl font-stencil text-gold text-center mb-6">BATTLE</h2>

        <div className="flex justify-between items-start">
          {/* Attacker side */}
          <CombatSide
            label="ATTACKER"
            units={combat.attackerUnits}
            cards={combat.attackerCards}
            dice={combat.attackerDice}
            total={combat.attackerTotal}
            isWinner={combat.result === "attacker_wins"}
          />

          {/* VS */}
          <div className="text-4xl font-stencil text-red self-center">VS</div>

          {/* Defender side */}
          <CombatSide
            label="DEFENDER"
            units={combat.defenderUnits}
            cards={combat.defenderCards}
            dice={combat.defenderDice}
            total={combat.defenderTotal}
            isWinner={combat.result === "defender_wins"}
          />
        </div>

        {/* Card play phase */}
        {combat.phase === "card_play" && <CombatCardPlayBar />}

        {/* Result */}
        {combat.result && <BattleResultBanner result={combat.result} losses={combat} />}
      </div>
    </div>
  );
}
```

### 4.6 WebSocket Hook

```typescript
function useWebSocket(roomId: string, playerId: string) {
  const setGameState = useGameStore(s => s.setGameState);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://${location.host}/api/rooms/${roomId}/ws?playerId=${playerId}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "state_update":
          setGameState(msg.state);
          break;
        case "error":
          toast.error(msg.message);
          break;
        case "chat":
          addChatMessage(msg);
          break;
      }
    };

    ws.onclose = () => {
      // Attempt reconnection after 1 second
      setTimeout(() => reconnect(), 1000);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [roomId, playerId]);

  const sendAction = useCallback((action: GameAction) => {
    wsRef.current?.send(JSON.stringify(action));
  }, []);

  return { sendAction };
}
```

### 4.7 Zustand Store

```typescript
interface GameStore {
  // Screen navigation
  screen: "landing" | "lobby" | "waiting" | "game" | "victory";
  setScreen: (screen: GameStore["screen"]) => void;

  // Game state (from server)
  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState) => void;

  // Local UI state
  myPlayerId: string | null;
  selectedTile: number | null;
  selectTile: (index: number | null) => void;
  showHowToPlay: boolean;
  chatMessages: ChatMessage[];
}

const useGameStore = create<GameStore>((set) => ({
  screen: "landing",
  setScreen: (screen) => set({ screen }),
  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  myPlayerId: null,
  selectedTile: null,
  selectTile: (index) => set({ selectedTile: index }),
  showHowToPlay: false,
  chatMessages: [],
}));
```

---

## 5. Board Configuration

### 5.1 Classic Board (20 tiles)

```typescript
const CLASSIC_BOARD: TileConfig[] = [
  // Bottom row (left to right)
  { index: 0,  name: "Supply Station",     type: "supply_station", cost: null, rent: null },
  { index: 1,  name: "Ashfield Outskirts", type: "territory",      cost: 8,    rent: 2 },
  { index: 2,  name: "Last Ammunition",    type: "ammo_draw",      cost: null, rent: null },
  { index: 3,  name: "Dusthaven",          type: "territory",      cost: 10,   rent: 3 },
  { index: 4,  name: "Tax Office",         type: "tax",            cost: null, rent: null },
  // Right column (bottom to top)
  { index: 5,  name: "Trenchtown Village", type: "territory",      cost: 12,   rent: 4 },
  { index: 6,  name: "Recruitment Post",   type: "recruitment",    cost: null, rent: null },
  { index: 7,  name: "Scrapyard Junction", type: "territory",      cost: 14,   rent: 4 },
  { index: 8,  name: "Rustwall Crossing",  type: "territory",      cost: 16,   rent: 5 },
  { index: 9,  name: "Last Ammunition",    type: "ammo_draw",      cost: null, rent: null },
  // Top row (right to left)
  { index: 10, name: "Ironclad City",      type: "territory",      cost: 20,   rent: 7 },
  { index: 11, name: "Munitions Depot",    type: "territory",      cost: 18,   rent: 6 },
  { index: 12, name: "Recruitment Post",   type: "recruitment",    cost: null, rent: null },
  { index: 13, name: "Blackstone Ridge",   type: "territory",      cost: 22,   rent: 8 },
  { index: 14, name: "Frostfang Castle",   type: "territory",      cost: 26,   rent: 10 },
  // Left column (top to bottom)
  { index: 15, name: "Last Ammunition",    type: "ammo_draw",      cost: null, rent: null },
  { index: 16, name: "Watchtower Heights", type: "territory",      cost: 24,   rent: 9 },
  { index: 17, name: "Tax Office",         type: "tax",            cost: null, rent: null },
  { index: 18, name: "Greyshore Harbor",   type: "territory",      cost: 15,   rent: 5 },
  { index: 19, name: "Embervale Camp",     type: "territory",      cost: 10,   rent: 3 },
];
```

### 5.2 Blitz Board (10 tiles)

```typescript
const BLITZ_BOARD: TileConfig[] = [
  { index: 0, name: "Supply Station",     type: "supply_station", cost: null, rent: null },
  { index: 1, name: "Dusthaven",          type: "territory",      cost: 10,   rent: 3 },
  { index: 2, name: "Last Ammunition",    type: "ammo_draw",      cost: null, rent: null },
  { index: 3, name: "Trenchtown Village", type: "territory",      cost: 14,   rent: 5 },
  { index: 4, name: "Recruitment Post",   type: "recruitment",    cost: null, rent: null },
  { index: 5, name: "Ironclad City",      type: "territory",      cost: 22,   rent: 8 },
  { index: 6, name: "Frostfang Castle",   type: "territory",      cost: 28,   rent: 11 },
  { index: 7, name: "Last Ammunition",    type: "ammo_draw",      cost: null, rent: null },
  { index: 8, name: "Blackstone Ridge",   type: "territory",      cost: 18,   rent: 6 },
  { index: 9, name: "Tax Office",         type: "tax",            cost: null, rent: null },
];
```

### 5.3 Game Balance Constants

```typescript
const BALANCE = {
  // Starting coins
  classic: { 2: 60, 3: 50, 4: 40 },
  blitz: { 2: 80, 3: 70 },

  // Income when passing Supply Station
  supplyIncome: 10,

  // Tax Office payment
  taxAmount: 5,

  // Building costs (level 1, 2, 3)
  buildCosts: [5, 10, 20],

  // Building rent multipliers
  rentMultiplier: { 0: 1, 1: 1.5, 2: 2, 3: 3 },

  // Unit costs and power
  units: {
    infantry: { cost: 3, power: 1 },
    tank:     { cost: 8, power: 3 },
    aircraft: { cost: 12, power: 5 },
  },

  // Card deck composition (30 cards total)
  deckComposition: {
    mercenary: 3,
    dummy_supplies: 3,
    fuse_mine: 2,
    land_tax: 3,
    war_fund: 3,
    surprise_attack: 2,
    surrounded: 2,
    transport_aircraft: 2,
    repressive: 3,
    military_investigation: 3,
    mobilisation_of_militia: 4,
  },

  // Max hand size
  maxHandSize: 5,

  // Sell price multiplier
  sellMultiplier: 0.5,
};
```

---

## 6. AI Design (server/src/ai.ts)

### 6.1 Decision Framework

```typescript
function computeAITurn(state: GameState, aiId: string): GameAction[] {
  const actions: GameAction[] = [];
  const ai = state.players.find(p => p.id === aiId)!;

  // 1. Roll dice (mandatory)
  actions.push({ type: "roll_dice" });
  // State will be updated — subsequent decisions use projected state

  // 2. Action phase decisions (based on landing tile)
  const landingTile = state.board[ai.position]; // projected after roll
  if (landingTile.type === "territory" && !landingTile.owner) {
    if (landingTile.purchaseCost! < ai.coins * 0.6) {
      actions.push({ type: "buy_territory" });
    } else {
      actions.push({ type: "pass_buy" });
    }
  }

  // 3. Combat decisions
  if (landingTile.owner && landingTile.owner !== aiId && landingTile.garrison.length > 0) {
    const myPower = sumCombatPower(ai.mobileArmy);
    const estimatedEnemyPower = estimateGarrisonPower(landingTile, state);
    if (myPower > estimatedEnemyPower * 1.3) {
      actions.push({ type: "combat_choice", choice: "military" });
    } else {
      actions.push({ type: "combat_choice", choice: "retreat" });
    }
  }

  // 4. Management phase
  // Recruit if affordable
  if (ai.coins > 20) {
    actions.push({ type: "recruit", unitType: "infantry", count: 2 });
  }
  // Deploy to mobile if no mobile army
  if (ai.mobileArmy.length < 2 && ai.reservePool.length > 0) {
    const toDeploy = ai.reservePool.slice(0, 2).map(u => u.id);
    actions.push({ type: "deploy_mobile", unitIds: toDeploy });
  }
  // Garrison high-value territories
  // Play economy cards if low on coins

  actions.push({ type: "end_management" });
  return actions;
}
```

---

## 7. Visual Theme

### 7.1 Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        army: {
          dark: "#2a3320",
          primary: "#3d4a2a",
          light: "#4a5a35",
        },
        khaki: "#c4a35a",
        gold: "#d4a847",
        cream: "#e8e0d0",
        danger: "#8b3a3a",
        player: {
          red: "#c94c4c",
          blue: "#4c7cc9",
          yellow: "#c9b84c",
          green: "#4cc96a",
        },
      },
      fontFamily: {
        stencil: ['"Black Ops One"', 'cursive'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
};
```

### 7.2 Key Visual Components

**Dice**: CSS 3D cubes with face dots, rolling animation via CSS transforms.

**Cards**: Styled divs with:
- Dark olive background with slight paper texture (CSS gradient)
- Gold border
- Military icon per card type
- Stencil font for card name

**Board tiles**: SVG rects with:
- Fill color based on tile type
- Owner border color (3px stroke)
- Building icons as small SVG shapes (1-3 markers)
- Hover effect: slight brighten + tooltip

---

## 8. WebSocket Protocol

### 8.1 Client → Server Messages

```typescript
type ClientMessage =
  | { type: "join"; playerName: string }
  | { type: "start_game" }
  | { type: "roll_dice" }
  | { type: "buy_territory" }
  | { type: "pass_buy" }
  | { type: "build"; tileIndex: number }
  | { type: "recruit"; unitType: UnitType; count: number }
  | { type: "deploy_mobile"; unitIds: string[] }
  | { type: "deploy_garrison"; unitIds: string[]; tileIndex: number }
  | { type: "transfer_to_garrison"; unitIds: string[] }
  | { type: "transfer_to_mobile"; unitIds: string[] }
  | { type: "sell_territory"; tileIndex: number }
  | { type: "play_card"; cardId: string; target?: number | string }
  | { type: "combat_choice"; choice: "military" | "costly" | "retreat" }
  | { type: "combat_play_card"; cardId: string }
  | { type: "combat_ready" }
  | { type: "leave_garrison"; unitIds: string[] }
  | { type: "end_management" }
  | { type: "discard_card"; cardId: string }
  | { type: "chat"; message: string };
```

### 8.2 Server → Client Messages

```typescript
type ServerMessage =
  | { type: "state_update"; state: ClientGameState }
  | { type: "error"; message: string }
  | { type: "chat"; playerId: string; playerName: string; message: string }
  | { type: "notification"; text: string }  // "Player X bought Ironclad City"
  | { type: "combat_start"; tileIndex: number; attackerId: string; defenderId: string }
  | { type: "dice_result"; dice: number[]; playerId: string }
  | { type: "player_eliminated"; playerId: string }
  | { type: "game_over"; winnerId: string };
```

---

## 9. Deployment

### 9.1 Cloudflare Configuration

**wrangler.toml** (server):
```toml
name = "king-of-war-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoom" }
]

[[migrations]]
tag = "v1"
new_classes = ["GameRoom"]
```

**Frontend** deploys to Cloudflare Pages via `wrangler pages deploy client/dist`.

### 9.2 Build & Deploy Commands

```bash
# Development
cd client && npm run dev          # Vite dev server
cd server && wrangler dev          # Workers dev server

# Production build
cd client && npm run build         # Vite build → client/dist
cd server && wrangler deploy       # Deploy Workers + Durable Objects
wrangler pages deploy client/dist  # Deploy frontend to Pages
```

---

## 10. Implementation Order

Build in this sequence to enable incremental testing:

### Phase 1: Foundation
1. **Project setup**: Vite + React + TypeScript + Tailwind + Workers project structure
2. **Shared types**: All TypeScript interfaces in `shared/`
3. **Board config**: Classic and Blitz tile definitions with balance constants

### Phase 2: Single-Player Core Loop
4. **Board rendering**: SVG board with tiles, commander pieces
5. **Game state machine**: Turn phases, dice rolling, movement
6. **Economy**: Buy/sell territory, pay rent, collect income, build structures
7. **Military units**: Recruit, deploy, transfer
8. **Combat system**: Full battle resolution with dice + unit power
9. **Cards**: All 11 card effects, draw/play/discard
10. **Fog of war**: Client-side filtering, Military Investigation reveal

### Phase 3: AI & Completion
11. **AI opponent**: Rule-based AI for all game phases
12. **Victory/elimination**: Bankruptcy flow, last player wins, victory screen

### Phase 4: Multiplayer
13. **Durable Object game room**: State management, WebSocket handling
14. **Lobby system**: Create/join/list rooms, waiting room
15. **Real-time sync**: Action broadcasting, reconnection
16. **Chat**: In-game messaging

### Phase 5: Polish
17. **Landing page**: Immersive entry with theme
18. **Animations**: Dice roll, piece movement, combat, cards
19. **How to Play**: Rules reference panel
20. **Blitz mode**: Separate board config, adjusted balance
