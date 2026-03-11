export type PlayerColor = "red" | "blue" | "yellow" | "green";
export type TileType = "territory" | "supply_station" | "ammo_draw" | "recruitment" | "tax";
export type UnitType = "infantry" | "tank" | "aircraft";
export type GamePhase = "movement" | "action" | "management" | "combat" | "ended";
export type GameMode = "classic" | "blitz";
export type CardType =
  | "mercenary" | "dummy_supplies" | "fuse_mine" | "land_tax"
  | "war_fund" | "surprise_attack" | "surrounded" | "transport_aircraft"
  | "repressive" | "mobilisation_of_militia";
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
  garrison: Unit[] | "hidden";
  hasFuseMine: boolean;
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
  hand: Card[] | number;
  isAI: boolean;
  isEliminated: boolean;
  isConnected: boolean;
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
  status: "waiting" | "playing" | "ended";
  phase: GamePhase;
  currentPlayerIndex: number;
  turnNumber: number;
  doublesRolled: boolean;
  lastDiceRoll: number[] | null;
  players: Player[];
  board: Tile[];
  deckCount: number;
  discardCount: number;
  combatState: CombatState | null;
  settings: GameSettings;
  winner: string | null;
}

export type Screen = "landing" | "lobby" | "waiting" | "game" | "victory";

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}
