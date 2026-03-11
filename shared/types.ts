export type PlayerColor = "red" | "blue" | "yellow" | "green";
export type TileType = "territory" | "supply_station" | "ammo_draw" | "recruitment" | "tax";
export type UnitType = "infantry" | "tank" | "aircraft";
export type GamePhase = "movement" | "action" | "management" | "combat" | "ended";
export type GameMode = "classic" | "blitz";
export type GameStatus = "waiting" | "playing" | "ended";

export type CardType =
  | "mercenary" | "dummy_supplies" | "fuse_mine" | "land_tax"
  | "war_fund" | "surprise_attack" | "surrounded" | "transport_aircraft"
  | "repressive" | "military_investigation" | "mobilisation_of_militia";

export type CardTiming = "combat" | "instant" | "defense" | "movement";

export interface Unit {
  id: string;
  type: UnitType;
  combatPower: number;
}

export interface Card {
  id: string;
  type: CardType;
  timing: CardTiming;
  name: string;
  description: string;
}

export interface Tile {
  index: number;
  name: string;
  type: TileType;
  purchaseCost: number | null;
  rentBase: number | null;
  buildingLevel: 0 | 1 | 2 | 3;
  buildCosts: [number, number, number];
  owner: string | null;
  garrison: Unit[];
  hasFuseMine: boolean;
  fuseMineOwner: string | null;
}

export interface PlayerStats {
  battlesWon: number;
  battlesLost: number;
  territoriesCaptured: number;
  coinsEarned: number;
  unitsRecruited: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  coins: number;
  position: number;
  previousPosition: number;
  ownedTerritories: number[];
  reservePool: Unit[];
  mobileArmy: Unit[];
  hand: Card[];
  isAI: boolean;
  isEliminated: boolean;
  isConnected: boolean;
  revealedGarrisons: number[];
  stats: PlayerStats;
}

export interface CombatState {
  attackerId: string;
  defenderId: string;
  tileIndex: number;
  phase: "card_play" | "dice_roll" | "resolution";
  attackerCards: Card[];
  defenderCards: Card[];
  attackerDice: number[] | null;
  defenderDice: number[] | null;
  attackerTotal: number | null;
  defenderTotal: number | null;
  result: "attacker_wins" | "defender_wins" | null;
  attackerLosses: Unit[];
  defenderLosses: Unit[];
}

export interface GameSettings {
  playerCount: number;
  mode: GameMode;
  turnTimer: number;
  isPrivate: boolean;
  roomCode: string;
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  phase: GamePhase;
  currentPlayerIndex: number;
  turnNumber: number;
  doublesRolled: boolean;
  lastDiceRoll: [number, number] | null;
  players: Player[];
  board: Tile[];
  cardDeck: Card[];
  discardPile: Card[];
  combatState: CombatState | null;
  settings: GameSettings;
  winner: string | null;
}

export type GameAction =
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
  | { type: "combat_ready" }
  | { type: "leave_garrison"; unitIds: string[] }
  | { type: "end_management" }
  | { type: "discard_card"; cardId: string }
  | { type: "chat"; message: string };
