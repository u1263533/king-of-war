# King of War - Enhanced Requirements

## Overview
Enhanced requirements expanding on spark, research, and differentiation. This document defines the full feature set for the King of War web game MVP and v1.1 roadmap.

---

## Module 1: Game Board & Navigation

### 1.1 Interactive Board Rendering
- Circular board path rendered as a stylized war map
- Board locations from physical game: Ironclad City, Trenchtown Village, Frostfang Castle, Supply Station, and other territory tiles
- Each tile shows: name, purchase cost, current owner (color-coded border), building icons, garrison indicator (fog — shows "?" for enemy garrisons)
- Commander pieces rendered as colored military figurines on the board
- Smooth animation for piece movement along the path
- Click/hover on any tile to see full details panel

### 1.2 Board Layout (from physical game)
- **Territory tiles** (~16-20 tiles): Each has a name, purchase cost, rent/tax value, and building slots
- **Special tiles**:
  - Supply Station (Start) — collect income when passing
  - Last Ammunition draw tiles — draw event card
  - Recruitment Post — recruit military units
  - Tax Office — pay tax
- Board center displays: current turn info, dice results, combat log

### 1.3 Blitz Mode Board
- Reduced board with ~10 tiles for faster games (20-25 min)
- Higher starting coins, 2-3 players only
- Faster elimination triggers (lower bankruptcy threshold)

---

## Module 2: Player & Economy System

### 2.1 Player State
- Each player has:
  - **Cannon Coins** (currency) — starting amount based on player count
  - **Owned territories** — list of purchased land tiles
  - **Reserve Force Pool** — recruited but undeployed units
  - **Mobile Army** — units traveling with commander
  - **Hand of cards** — Last Ammunition event cards (max hand size: 5)
  - **Commander position** — current tile on board

### 2.2 Economic Actions
- **Purchase land**: When landing on unoccupied territory, option to buy at listed price
- **Pay rent/tax**: When landing on enemy territory, automatically pay rent to owner
- **Sell land**: During your turn, sell any owned territory at 50% of purchase price
- **Build structures**: On owned land, spend coins to build/upgrade (increases rent value)
  - Level 1: Outpost (+50% rent)
  - Level 2: Fortress (+100% rent)
  - Level 3: Stronghold (+200% rent)
- **Collect income**: Receive salary when passing/landing on Supply Station

### 2.3 Bankruptcy & Elimination
- If a player cannot afford a mandatory payment (rent, tax, combat cost):
  1. Prompt to sell territories to raise funds
  2. If still insufficient after selling all assets → bankruptcy
  3. Bankrupt player is eliminated; their remaining territories become unoccupied
  4. Last player standing wins

---

## Module 3: Military Unit System

### 3.1 Unit Types
| Unit | Cost | Combat Power | Special |
|------|------|-------------|---------|
| Infantry | 3 coins | 1 | Cheapest, bulk force |
| Tank | 8 coins | 3 | Strong ground unit |
| Aircraft | 12 coins | 5 | Most powerful, expensive |

### 3.2 Recruitment
- Available at Recruitment Post tiles or during Management Phase on owned territory
- Spend coins → units enter Reserve Force Pool
- No limit on reserve pool size

### 3.3 Deployment
- **To Mobile Army**: Move units from reserve pool to commander's current position. These units travel with the commander.
- **To Garrison**: Move units from reserve pool to any owned territory. These units stay on that territory permanently (until transferred or destroyed).

### 3.4 Management Phase
- Once per turn, before ending turn, player can:
  - Transfer units between Mobile Army ↔ Garrison (only at commander's current location)
  - Deploy from Reserve Pool to Mobile Army or Garrison
  - View all garrison distributions across owned territories

### 3.5 Fog of War
- Each player can see:
  - Their own garrisons (full detail)
  - Enemy territory ownership (visible)
  - Enemy garrison existence (shows "garrisoned" icon but NOT unit count or composition)
  - Enemy mobile army (visible — moves with their commander)
- Military Investigation card reveals one enemy garrison's composition

---

## Module 4: Combat System

### 4.1 Combat Trigger
When a player's commander lands on a territory owned by another player that has garrison forces, combat is initiated. The attacker chooses:
- **Military Battle**: Fight with mobile army vs garrison
- **Costly Battle**: Pay the rent/tax + play a card to avoid combat
- **Retreat**: Move back to previous position (lose 1 random unit)

### 4.2 Battle Resolution
1. **Attacker rolls** 2 dice + sums combat power of all mobile army units
2. **Defender rolls** 2 dice + sums combat power of all garrison units on that territory
3. **Cards**: Either side may play combat cards (Mercenary, Surprise Attack, Surrounded, Dummy Supplies) before dice roll
4. **Compare totals**: Higher total wins. Defender wins ties.
5. **Losses**: Losing side loses units proportionally to the difference in scores
   - Difference 1-3: Lose 1 unit (weakest first)
   - Difference 4-6: Lose 2 units
   - Difference 7+: Lose all units
6. **Territory capture**: If defender loses all garrison units, attacker captures territory. Attacker may leave units as new garrison.

### 4.3 Combat UI
- Split-screen battle view showing attacker vs defender
- Animated dice roll with dramatic pause
- Unit cards displayed for both sides (attacker sees own units; defender's garrison revealed only during combat)
- Combat log showing calculations
- Card play prompt before dice roll

---

## Module 5: Last Ammunition Event Cards

### 5.1 Card Deck
Shared deck of 30 cards (multiple copies of each type), shuffled at game start.

### 5.2 Drawing Cards
- Land on a "Last Ammunition" tile → draw 1 card
- Some cards grant draws as effects
- Max hand size: 5 cards. Must discard if exceeded.

### 5.3 Card Definitions

| Card | Type | Effect |
|------|------|--------|
| **Mercenary** | Combat | Play before battle. Adds a mercenary unit (+2 combat power) for this battle only. |
| **Dummy Supplies** | Combat | +1 combat strength for your next battle. |
| **Fuse Mine** | Defense | Place on any owned territory. Next attacker takes 2 damage to their total before combat. |
| **Land Tax** | Economy | Collect 2 coins from each city you own. |
| **War Fund** | Economy | Immediately receive 4 coins. |
| **Surprise Attack** | Combat | Play when attacking. Roll 3 dice instead of 2. |
| **Surrounded** | Combat | Play in battle. Enemy cannot retreat. |
| **Transport Aircraft** | Movement | Instantly move your commander to any tile on the board. |
| **Repressive** | Economy/Attack | Target player loses 5 coins. |
| **Military Investigation** | Intelligence | Reveal the full garrison composition of any one enemy territory. |
| **Mobilisation of Militia** | Recruitment | Instantly recruit 2 infantry units for free into your reserve pool. |

### 5.4 Card UI
- Cards displayed as a hand at bottom of screen (face up to owning player only)
- Click card to see full description
- Contextual play prompts (combat cards shown during battle, movement cards during movement phase)
- Animated card play effect

---

## Module 6: Turn Structure

### 6.1 Phase Sequence
Each player's turn follows this sequence:

1. **Movement Phase**
   - Roll 2 dice (animated)
   - Commander moves clockwise by the total
   - Doubles → extra roll after completing this turn's actions

2. **Action Phase** (based on landing tile)
   - Unoccupied territory → Buy prompt
   - Own territory → Build/upgrade prompt
   - Enemy territory (no garrison) → Pay rent
   - Enemy territory (garrisoned) → Combat or Costly Battle
   - Special tile → Execute special effect (draw card, recruit, pay tax)

3. **Management Phase**
   - Deploy units from reserve pool
   - Transfer units between mobile army and garrisons (at current location)
   - Play non-combat cards (Transport Aircraft, Land Tax, etc.)
   - Sell territories if desired

4. **End Turn**
   - Pass to next player clockwise
   - If doubles were rolled, return to Movement Phase instead

### 6.2 Turn Timer
- 60-second timer per phase (configurable in room settings)
- Auto-skip if timer expires (no action taken)
- Extended timer option for new players

---

## Module 7: Multiplayer & Lobby System

### 7.1 Game Lobby
- Create room with settings:
  - Player count (2-4 for MVP)
  - Game mode (Classic / Blitz)
  - Turn timer (30s / 60s / 90s / unlimited)
  - AI fill (fill empty slots with AI)
  - Private/Public room
- Room code for private invites
- Public room list with join button

### 7.2 Real-Time Sync
- WebSocket connection per player to game room
- Server-authoritative: all game logic runs server-side
- Client sends: intended action (roll dice, buy land, deploy unit, play card, attack)
- Server validates, updates state, broadcasts to all clients
- Reconnection handling: player can rejoin within 2 minutes of disconnect

### 7.3 Game Chat
- In-game text chat between players
- Pre-set quick messages ("Good move!", "Let's trade", "I'm coming for you")
- Chat log visible during game

---

## Module 8: AI Opponents

### 8.1 AI Difficulty: Standard
Single AI difficulty for MVP that handles:
- **Economic decisions**: Buy land when affordable (>60% of current coins), prioritize high-rent territories
- **Military decisions**: Maintain balanced garrison/mobile ratio, recruit when coins > 20
- **Combat decisions**: Attack when mobile army power > estimated garrison power * 1.3, retreat otherwise
- **Card play**: Use combat cards when in battle, economy cards when low on coins

### 8.2 AI Behavior
- AI takes turns with a 1-2 second simulated "thinking" delay
- AI actions are animated same as human players
- AI names drawn from warlord theme: "General Steel", "Commander Vex", "Warlord Ash"

---

## Module 9: UI/UX Design

### 9.1 Visual Theme
- **Color palette**:
  - Primary: Dark olive green (#3d4a2a)
  - Secondary: Khaki/tan (#c4a35a)
  - Accent: Military gold (#d4a847)
  - Background: Dark army green (#2a3320)
  - Danger: Muted red (#8b3a3a)
  - Text: Off-white (#e8e0d0)
- **Typography**: Military stencil font for headers, clean sans-serif for body
- **Card style**: Weathered paper texture, military illustration art
- **Board style**: Tactical map aesthetic with grid lines and terrain markings

### 9.2 Layout (Desktop)
```
┌─────────────────────────────────────────────────┐
│  HEADER: Game title, turn indicator, timer       │
├────────────┬────────────────────┬───────────────┤
│            │                    │               │
│  PLAYER    │                    │  TERRITORY    │
│  PANEL     │    GAME BOARD      │  DETAILS      │
│  (economy, │    (center)        │  PANEL        │
│  units,    │                    │  (selected    │
│  stats)    │                    │   tile info)  │
│            │                    │               │
├────────────┴────────────────────┴───────────────┤
│  CARD HAND  |  ACTION BUTTONS  |  CHAT/LOG      │
└─────────────────────────────────────────────────┘
```

### 9.3 Key Interactions
- **Dice roll**: Click "Roll" button or press Space
- **Buy land**: Modal popup with territory details + Buy/Pass buttons
- **Deploy units**: Drag from reserve pool to board position, or click + dropdown
- **Play card**: Click card in hand, then click target (if applicable)
- **Combat**: Full-screen overlay with attacker/defender, dice animation, card play slots

### 9.4 Animations
- Dice rolling with physics simulation
- Commander piece sliding along board path
- Combat explosions and unit removal
- Card draw and play effects
- Coin transfer animations
- Victory screen with "KING OF WAR" title and crown animation

---

## Module 10: Game Flow & Screens

### 10.1 Screen Flow
1. **Landing Page** — Title, "Play Now" button, brief game description
2. **Lobby** — Create/join game rooms
3. **Waiting Room** — See connected players, adjust settings, start game
4. **Game Screen** — Main gameplay
5. **Victory Screen** — Winner announcement, stats summary, "Play Again" button

### 10.2 Landing Page
- Full-screen dark military background
- "KING OF WAR" title in large military stencil font
- Tagline: "Build Your Empire. Command Your Army."
- "Play Now" primary CTA
- "How to Play" secondary link (opens rules summary)
- Footer with game credits

### 10.3 How to Play (In-Game Reference)
- Collapsible rules panel accessible during gameplay
- Covers: turn structure, combat, cards, victory condition
- Visual examples for each mechanic

---

## Module 11: Technical Requirements

### 11.1 Tech Stack
- **Frontend**: React + TypeScript + Vite
- **State Management**: Zustand for client game state
- **Board Rendering**: SVG/CSS for board, HTML for UI panels
- **Backend**: Cloudflare Workers + Durable Objects
- **WebSocket**: Native WebSocket via Durable Objects
- **Deployment**: Cloudflare Pages (frontend) + Workers (backend)
- **Styling**: Tailwind CSS with custom military theme

### 11.2 Performance Targets
- Initial page load: <3 seconds
- WebSocket message latency: <100ms
- Dice roll animation: 1.5 seconds
- Turn transition: <500ms
- Support 4 concurrent players per room, 100+ concurrent rooms

### 11.3 Browser Support
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Desktop-first, basic mobile layout for MVP

---

## Module 12: Data Model (Core Entities)

### 12.1 Game State
```
GameState {
  id: string
  mode: "classic" | "blitz"
  phase: "movement" | "action" | "management" | "combat" | "ended"
  currentPlayerIndex: number
  turnNumber: number
  players: Player[]
  board: Tile[]
  cardDeck: Card[]
  discardPile: Card[]
  combatState: CombatState | null
  settings: GameSettings
}
```

### 12.2 Player
```
Player {
  id: string
  name: string
  color: string
  coins: number
  position: number (tile index)
  ownedTerritories: number[] (tile indices)
  reservePool: Unit[]
  mobileArmy: Unit[]
  hand: Card[]
  isAI: boolean
  isEliminated: boolean
  isConnected: boolean
}
```

### 12.3 Tile
```
Tile {
  index: number
  name: string
  type: "territory" | "supply_station" | "ammo_draw" | "recruitment" | "tax"
  purchaseCost: number | null
  rentBase: number | null
  buildingLevel: 0 | 1 | 2 | 3
  owner: string | null (player id)
  garrison: Unit[] (hidden from other players)
}
```

### 12.4 Unit
```
Unit {
  id: string
  type: "infantry" | "tank" | "aircraft"
  combatPower: number (1 | 3 | 5)
}
```

### 12.5 Card
```
Card {
  id: string
  type: "mercenary" | "dummy_supplies" | "fuse_mine" | "land_tax" | "war_fund" | "surprise_attack" | "surrounded" | "transport_aircraft" | "repressive" | "military_investigation" | "mobilisation_of_militia"
  timing: "combat" | "instant" | "defense" | "movement"
}
```

---

## Non-Functional Requirements

### Security
- Server-authoritative game logic (no client-side game state manipulation)
- Rate limiting on WebSocket messages
- Room codes use cryptographically random strings
- No sensitive data stored client-side

### Accessibility
- Keyboard navigation for all actions
- Color-blind friendly player colors (distinct shapes + colors)
- Screen reader support for game state announcements

### Localization
- English as primary language
- Chinese (Simplified) as secondary language (given game origin)
- All UI strings externalized for easy translation
