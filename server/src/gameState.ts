import type {
  GameState, GameSettings, GameAction, GamePhase, Player, Tile, Unit, Card,
  CombatState, PlayerColor, UnitType, CardType,
} from "../../shared/types";
import {
  CLASSIC_BOARD, BLITZ_BOARD, BALANCE, UNIT_CONFIG, DECK_COMPOSITION, CARD_DEFINITIONS,
} from "../../shared/constants";

// ─── Helpers ───

let unitCounter = 0;
function createUnit(type: UnitType): Unit {
  return {
    id: `unit-${++unitCounter}`,
    type,
    combatPower: UNIT_CONFIG[type].power,
  };
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const [type, count] of Object.entries(DECK_COMPOSITION) as [CardType, number][]) {
    const def = CARD_DEFINITIONS[type];
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `card-${++id}`,
        type,
        timing: def.timing,
        name: def.name,
        description: def.description,
      });
    }
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

const PLAYER_COLORS: PlayerColor[] = ["red", "blue", "yellow", "green"];

function makePlayer(index: number, coins: number): Player {
  return {
    id: `p${index}`,
    name: `Player ${index + 1}`,
    color: PLAYER_COLORS[index],
    coins,
    position: 0,
    previousPosition: 0,
    ownedTerritories: [],
    reservePool: [],
    mobileArmy: [],
    hand: [],
    isAI: false,
    isEliminated: false,
    isConnected: true,
    revealedGarrisons: [],
    stats: { battlesWon: 0, battlesLost: 0, territoriesCaptured: 0, coinsEarned: 0, unitsRecruited: 0 },
  };
}

// ─── Create Initial State ───

export function createInitialState(gameId: string, settings: GameSettings): GameState {
  const board = deepClone(settings.mode === "blitz" ? BLITZ_BOARD : CLASSIC_BOARD);
  const coinTable = settings.mode === "blitz" ? BALANCE.startingCoins.blitz : BALANCE.startingCoins.classic;
  const startCoins = coinTable[settings.playerCount] ?? 50;

  const players: Player[] = [];
  for (let i = 0; i < settings.playerCount; i++) {
    players.push(makePlayer(i, startCoins));
  }

  return {
    id: gameId,
    mode: settings.mode,
    status: "waiting",
    phase: "movement",
    currentPlayerIndex: 0,
    turnNumber: 0,
    doublesRolled: false,
    lastDiceRoll: null,
    players,
    board,
    cardDeck: buildDeck(),
    discardPile: [],
    combatState: null,
    settings,
    winner: null,
  };
}

// ─── Phase helpers ───

export function getNextPhase(current: GamePhase): GamePhase {
  switch (current) {
    case "movement": return "action";
    case "action": return "management";
    case "management": return "movement";
    case "combat": return "action";
    default: return current;
  }
}

// ─── Process Action ───

export function processAction(
  state: GameState,
  action: GameAction,
): { state: GameState; error?: string } {
  // Deep clone to avoid mutations
  const s = deepClone(state);

  switch (action.type) {
    case "start_game":
      return handleStartGame(s);
    case "roll_dice":
      return handleRollDice(s);
    case "buy_territory":
      return handleBuyTerritory(s);
    case "pass_buy":
      return handlePassBuy(s);
    case "build":
      return handleBuild(s, action.tileIndex);
    case "recruit":
      return handleRecruit(s, action.unitType, action.count);
    case "deploy_mobile":
      return handleDeployMobile(s, action.unitIds);
    case "deploy_garrison":
      return handleDeployGarrison(s, action.unitIds, action.tileIndex);
    case "transfer_to_garrison":
      return handleTransferToGarrison(s, action.unitIds);
    case "transfer_to_mobile":
      return handleTransferToMobile(s, action.unitIds);
    case "sell_territory":
      return handleSellTerritory(s, action.tileIndex);
    case "end_management":
      return handleEndManagement(s);
    case "play_card":
      return handlePlayCard(s, action.cardId, action.target);
    case "combat_choice":
      return handleCombatChoice(s, action.choice);
    case "combat_play_card":
      return handleCombatPlayCard(s, action.cardId);
    case "combat_ready":
      return handleCombatReady(s);
    case "discard_card":
      return handleDiscardCard(s, action.cardId);
    default:
      return { state: s };
  }
}

// ─── Action Handlers ───

function handleStartGame(s: GameState): { state: GameState; error?: string } {
  if (s.status !== "waiting") {
    return { state: s, error: "Game is not in waiting state" };
  }
  s.status = "playing";
  s.phase = "movement";
  s.turnNumber = 1;
  return { state: s };
}

function handleRollDice(s: GameState): { state: GameState; error?: string } {
  if (s.phase !== "movement") {
    return { state: s, error: "Can only roll dice during movement phase" };
  }

  const d1 = rollDie();
  const d2 = rollDie();
  s.lastDiceRoll = [d1, d2];
  s.doublesRolled = d1 === d2;

  const player = s.players[s.currentPlayerIndex];
  const total = d1 + d2;
  const boardSize = s.board.length;
  const oldPos = player.position;
  const newPos = (oldPos + total) % boardSize;

  // Check if passed Supply Station (position 0)
  if (newPos < oldPos || (oldPos + total) >= boardSize) {
    // Passed or landed on supply station
    if (newPos !== 0) {
      player.coins += BALANCE.supplyIncome;
    } else {
      // Landed exactly on supply station
      player.coins += BALANCE.supplyIncome;
    }
  }

  player.previousPosition = oldPos;
  player.position = newPos;
  s.phase = "action";

  return { state: s };
}

function handleLanding(s: GameState, player: Player): void {
  const tile = s.board[player.position];

  if (tile.type === "tax") {
    player.coins = Math.max(0, player.coins - BALANCE.taxAmount);
  }

  if (tile.type === "ammo_draw") {
    drawCard(s, player);
  }

  if (tile.type === "recruitment") {
    // Free infantry on recruitment post
    player.reservePool.push(createUnit("infantry"));
  }
}

function drawCard(s: GameState, player: Player): void {
  if (player.hand.length >= BALANCE.maxHandSize) return;
  if (s.cardDeck.length === 0) {
    // Reshuffle discard pile
    if (s.discardPile.length === 0) return;
    s.cardDeck = deepClone(s.discardPile);
    s.discardPile = [];
  }
  const card = s.cardDeck.pop();
  if (card) {
    player.hand.push(card);
  }
}

function handleBuyTerritory(s: GameState): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];

  if (tile.type !== "territory") {
    return { state: s, error: "This tile is not a territory" };
  }
  if (tile.owner !== null) {
    return { state: s, error: "Territory is already owned" };
  }
  if (tile.purchaseCost !== null && player.coins < tile.purchaseCost) {
    return { state: s, error: "Insufficient coins" };
  }

  player.coins -= tile.purchaseCost!;
  tile.owner = player.id;
  player.ownedTerritories.push(tile.index);
  s.phase = "management";
  return { state: s };
}

function handlePassBuy(s: GameState): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];

  // If on enemy territory, pay rent
  if (tile.type === "territory" && tile.owner !== null && tile.owner !== player.id) {
    const rentResult = applyRent(s, player, tile);
    if (rentResult.error) return rentResult;
    s = rentResult.state;
  }

  s.phase = "management";
  return { state: s };
}

function applyRent(s: GameState, player: Player, tile: Tile): { state: GameState; error?: string } {
  const owner = s.players.find(p => p.id === tile.owner);
  if (!owner || !tile.rentBase) return { state: s };

  const multiplier = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
  const rent = Math.floor(tile.rentBase * multiplier);

  if (player.coins < rent) {
    // Bankruptcy check
    if (player.ownedTerritories.length === 0) {
      // No assets to sell - eliminate
      player.isEliminated = true;
      // Transfer remaining coins to owner
      owner.coins += player.coins;
      player.coins = 0;
      checkVictory(s);
      return { state: s };
    }
    // Player might need to sell assets, but for simplicity handle bankruptcy
    player.isEliminated = true;
    owner.coins += player.coins;
    player.coins = 0;
    checkVictory(s);
    return { state: s };
  }

  player.coins -= rent;
  owner.coins += rent;
  return { state: s };
}

function checkVictory(s: GameState): void {
  const alive = s.players.filter(p => !p.isEliminated);
  if (alive.length <= 1) {
    s.status = "ended";
    s.phase = "ended";
    if (alive.length === 1) {
      s.winner = alive[0].id;
    } else {
      // All eliminated — last creditor wins (find non-eliminated player among original or last standing)
      // In a 2-player game, the tile owner (creditor) is the winner
      const lastEliminated = s.players.findIndex(p => p.isEliminated && p.coins === 0 && p.ownedTerritories.length === 0);
      const other = s.players.find((p, i) => i !== lastEliminated);
      s.winner = other?.id ?? null;
    }
  }
}

function handleBuild(s: GameState, tileIndex: number): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];

  if (tile.owner !== player.id) {
    return { state: s, error: "You do not own this territory" };
  }
  if (tile.buildingLevel >= 3) {
    return { state: s, error: "Territory is already at max building level" };
  }

  const cost = tile.buildCosts[tile.buildingLevel as 0 | 1 | 2];
  if (player.coins < cost) {
    return { state: s, error: "Insufficient coins" };
  }

  player.coins -= cost;
  tile.buildingLevel = (tile.buildingLevel + 1) as 0 | 1 | 2 | 3;
  return { state: s };
}

function handleRecruit(s: GameState, unitType: UnitType, count: number): { state: GameState; error?: string } {
  if (count <= 0) {
    return { state: s, error: "Count must be positive" };
  }

  const player = s.players[s.currentPlayerIndex];
  const unitCost = UNIT_CONFIG[unitType].cost;
  const totalCost = unitCost * count;

  if (player.coins < totalCost) {
    return { state: s, error: "Insufficient coins" };
  }

  player.coins -= totalCost;
  for (let i = 0; i < count; i++) {
    player.reservePool.push(createUnit(unitType));
  }
  return { state: s };
}

function handleDeployMobile(s: GameState, unitIds: string[]): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];

  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    if (idx === -1) {
      return { state: s, error: `Unit ${id} not found in reserve pool` };
    }
  }

  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    const [unit] = player.reservePool.splice(idx, 1);
    player.mobileArmy.push(unit);
  }
  return { state: s };
}

function handleDeployGarrison(s: GameState, unitIds: string[], tileIndex: number): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];

  if (tile.owner !== player.id) {
    return { state: s, error: "You do not own this territory" };
  }

  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    if (idx === -1) {
      return { state: s, error: `Unit ${id} not found in reserve pool` };
    }
  }

  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    const [unit] = player.reservePool.splice(idx, 1);
    tile.garrison.push(unit);
  }
  return { state: s };
}

function handleTransferToGarrison(s: GameState, unitIds: string[]): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];

  if (tile.owner !== player.id) {
    return { state: s, error: "You are not on your own territory" };
  }

  for (const id of unitIds) {
    const idx = player.mobileArmy.findIndex(u => u.id === id);
    if (idx === -1) {
      return { state: s, error: `Unit ${id} not in mobile army` };
    }
    const [unit] = player.mobileArmy.splice(idx, 1);
    tile.garrison.push(unit);
  }
  return { state: s };
}

function handleTransferToMobile(s: GameState, unitIds: string[]): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];

  if (tile.owner !== player.id) {
    return { state: s, error: "You are not on your own territory" };
  }

  for (const id of unitIds) {
    const idx = tile.garrison.findIndex(u => u.id === id);
    if (idx === -1) {
      return { state: s, error: `Unit ${id} not in garrison` };
    }
    const [unit] = tile.garrison.splice(idx, 1);
    player.mobileArmy.push(unit);
  }
  return { state: s };
}

function handleSellTerritory(s: GameState, tileIndex: number): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];

  if (tile.owner !== player.id) {
    return { state: s, error: "You do not own this territory" };
  }

  // Sell for 50% of purchase cost
  const sellPrice = Math.floor((tile.purchaseCost ?? 0) * BALANCE.sellMultiplier);
  player.coins += sellPrice;

  // Return garrison to reserve pool
  player.reservePool.push(...tile.garrison);
  tile.garrison = [];

  // Reset tile
  tile.owner = null;
  tile.buildingLevel = 0;
  player.ownedTerritories = player.ownedTerritories.filter(i => i !== tileIndex);

  return { state: s };
}

function handleEndManagement(s: GameState): { state: GameState; error?: string } {
  // If doubles were rolled, same player goes again
  if (s.doublesRolled) {
    s.doublesRolled = false;
    s.phase = "movement";
    return { state: s };
  }

  // Advance to next non-eliminated player
  const playerCount = s.players.length;
  let nextIdx = (s.currentPlayerIndex + 1) % playerCount;
  let loopCount = 0;
  while (s.players[nextIdx].isEliminated && loopCount < playerCount) {
    nextIdx = (nextIdx + 1) % playerCount;
    loopCount++;
  }

  // Check if we wrapped around (new turn)
  if (nextIdx <= s.currentPlayerIndex) {
    s.turnNumber++;
  }

  s.currentPlayerIndex = nextIdx;
  s.phase = "movement";
  return { state: s };
}

function handlePlayCard(s: GameState, cardId: string, target?: number | string): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) {
    return { state: s, error: "Card not found in hand" };
  }

  const card = player.hand[cardIdx];

  switch (card.type) {
    case "war_fund":
      player.coins += 4;
      break;

    case "land_tax":
      player.coins += player.ownedTerritories.length * 2;
      break;

    case "repressive": {
      const targetPlayer = s.players.find(p => p.id === target);
      if (targetPlayer) {
        targetPlayer.coins = Math.max(0, targetPlayer.coins - 5);
      }
      break;
    }

    case "mobilisation_of_militia":
      player.reservePool.push(createUnit("infantry"), createUnit("infantry"));
      break;

    case "military_investigation": {
      const tileIdx = target as number;
      if (!player.revealedGarrisons.includes(tileIdx)) {
        player.revealedGarrisons.push(tileIdx);
      }
      break;
    }

    case "transport_aircraft": {
      const targetTile = target as number;
      player.previousPosition = player.position;
      player.position = targetTile;
      break;
    }

    case "fuse_mine": {
      const tileIdx = target as number;
      s.board[tileIdx].hasFuseMine = true;
      s.board[tileIdx].fuseMineOwner = player.id;
      break;
    }

    default:
      break;
  }

  // Remove from hand, add to discard
  player.hand.splice(cardIdx, 1);
  s.discardPile.push(card);
  return { state: s };
}

function handleCombatChoice(s: GameState, choice: "military" | "costly" | "retreat"): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];
  const owner = s.players.find(p => p.id === tile.owner);

  if (choice === "military") {
    if (player.mobileArmy.length === 0) {
      return { state: s, error: "No mobile army to attack with" };
    }
    // Initiate combat
    s.combatState = {
      attackerId: player.id,
      defenderId: tile.owner!,
      tileIndex: player.position,
      phase: "card_play",
      attackerCards: [],
      defenderCards: [],
      attackerDice: null,
      defenderDice: null,
      attackerTotal: null,
      defenderTotal: null,
      result: null,
      attackerLosses: [],
      defenderLosses: [],
    };
    s.phase = "combat";
    return { state: s };
  }

  if (choice === "costly") {
    // Pay double rent
    if (tile.rentBase && owner) {
      const multiplier = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
      const rent = Math.floor(tile.rentBase * multiplier * 2);
      player.coins -= rent;
      owner.coins += rent;
    }
    s.combatState = null;
    s.phase = "management";
    return { state: s };
  }

  if (choice === "retreat") {
    // Pay normal rent
    if (tile.rentBase && owner) {
      const multiplier = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
      const rent = Math.floor(tile.rentBase * multiplier);
      player.coins -= rent;
      owner.coins += rent;
    }
    s.combatState = null;
    s.phase = "management";
    return { state: s };
  }

  return { state: s };
}

function handleCombatPlayCard(s: GameState, cardId: string): { state: GameState; error?: string } {
  if (!s.combatState) {
    return { state: s, error: "No active combat" };
  }

  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) {
    return { state: s, error: "Card not found in hand" };
  }

  const card = player.hand[cardIdx];
  player.hand.splice(cardIdx, 1);

  if (player.id === s.combatState.attackerId) {
    s.combatState.attackerCards.push(card);
  } else {
    s.combatState.defenderCards.push(card);
  }

  return { state: s };
}

function handleCombatReady(s: GameState): { state: GameState; error?: string } {
  if (!s.combatState) {
    return { state: s, error: "No active combat" };
  }

  const combat = s.combatState;
  const attacker = s.players.find(p => p.id === combat.attackerId)!;
  const tile = s.board[combat.tileIndex];

  // Roll dice
  let attackerDiceCount = 2;
  if (combat.attackerCards.some(c => c.type === "surprise_attack")) {
    attackerDiceCount = 3;
  }
  const attackerDice = Array.from({ length: attackerDiceCount }, () => rollDie());
  const defenderDice = [rollDie(), rollDie()];

  // Calculate unit power
  const attackerUnitPower = attacker.mobileArmy.reduce((sum, u) => sum + u.combatPower, 0);
  const defenderUnitPower = tile.garrison.reduce((sum, u) => sum + u.combatPower, 0);

  // Card bonuses
  let attackerCardBonus = 0;
  for (const c of combat.attackerCards) {
    if (c.type === "mercenary") attackerCardBonus += 2;
    if (c.type === "dummy_supplies") attackerCardBonus += 1;
  }
  let defenderCardBonus = 0;
  for (const c of combat.defenderCards) {
    if (c.type === "mercenary") defenderCardBonus += 2;
    if (c.type === "dummy_supplies") defenderCardBonus += 1;
  }

  const attackerDiceSum = attackerDice.reduce((a, b) => a + b, 0);
  const defenderDiceSum = defenderDice.reduce((a, b) => a + b, 0);

  let attackerTotal = attackerUnitPower + attackerDiceSum + attackerCardBonus;
  let defenderTotal = defenderUnitPower + defenderDiceSum + defenderCardBonus;

  // Fuse mine: -2 to attacker
  if (tile.hasFuseMine) {
    attackerTotal = Math.max(0, attackerTotal - 2);
    tile.hasFuseMine = false;
    tile.fuseMineOwner = null;
  }

  // Defender wins ties
  const result = attackerTotal > defenderTotal ? "attacker_wins" : "defender_wins";

  // Calculate losses
  const diff = Math.abs(attackerTotal - defenderTotal);
  const lossCount = diff <= 3 ? 1 : diff <= 6 ? 2 : Infinity;

  let attackerLosses: Unit[] = [];
  let defenderLosses: Unit[] = [];

  if (result === "attacker_wins") {
    // Defender loses units
    const sorted = [...tile.garrison].sort((a, b) => a.combatPower - b.combatPower);
    defenderLosses = sorted.splice(0, Math.min(lossCount, sorted.length));
    tile.garrison = tile.garrison.filter(u => !defenderLosses.some(l => l.id === u.id));
  } else {
    // Attacker loses units
    const sorted = [...attacker.mobileArmy].sort((a, b) => a.combatPower - b.combatPower);
    attackerLosses = sorted.splice(0, Math.min(lossCount, sorted.length));
    attacker.mobileArmy = attacker.mobileArmy.filter(u => !attackerLosses.some(l => l.id === u.id));
  }

  combat.phase = "resolution";
  combat.attackerDice = attackerDice;
  combat.defenderDice = defenderDice;
  combat.attackerTotal = attackerTotal;
  combat.defenderTotal = defenderTotal;
  combat.result = result;
  combat.attackerLosses = attackerLosses;
  combat.defenderLosses = defenderLosses;

  return { state: s };
}

function handleDiscardCard(s: GameState, cardId: string): { state: GameState; error?: string } {
  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) {
    return { state: s, error: "Card not found in hand" };
  }
  const [card] = player.hand.splice(cardIdx, 1);
  s.discardPile.push(card);
  return { state: s };
}

// ─── Player View (Fog of War) ───

export interface PlayerViewTile {
  index: number;
  name: string;
  type: Tile["type"];
  purchaseCost: number | null;
  rentBase: number | null;
  buildingLevel: 0 | 1 | 2 | 3;
  buildCosts: [number, number, number];
  owner: string | null;
  garrison: Unit[] | "hidden";
  garrisonCount: number;
  hasFuseMine: boolean;
  fuseMineOwner: string | null;
}

export interface PlayerViewPlayer {
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
  handCount: number;
  isAI: boolean;
  isEliminated: boolean;
  isConnected: boolean;
  revealedGarrisons: number[];
  stats: Player["stats"];
}

export interface PlayerView {
  id: string;
  mode: GameState["mode"];
  status: GameState["status"];
  phase: GameState["phase"];
  currentPlayerIndex: number;
  turnNumber: number;
  doublesRolled: boolean;
  lastDiceRoll: [number, number] | null;
  players: PlayerViewPlayer[];
  board: PlayerViewTile[];
  cardDeckCount: number;
  discardPile: Card[];
  combatState: CombatState | null;
  settings: GameSettings;
  winner: string | null;
}

function shouldRevealGarrison(tile: Tile, playerId: string, state: GameState): boolean {
  if (tile.owner === playerId) return true;
  const player = state.players.find(p => p.id === playerId);
  if (player?.revealedGarrisons.includes(tile.index)) return true;
  if (state.combatState?.tileIndex === tile.index) return true;
  return false;
}

export function createPlayerView(state: GameState, playerId: string): PlayerView {
  return {
    id: state.id,
    mode: state.mode,
    status: state.status,
    phase: state.phase,
    currentPlayerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
    doublesRolled: state.doublesRolled,
    lastDiceRoll: state.lastDiceRoll,
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      coins: p.coins,
      position: p.position,
      previousPosition: p.previousPosition,
      ownedTerritories: p.ownedTerritories,
      reservePool: p.id === playerId ? p.reservePool : [],
      mobileArmy: p.mobileArmy,
      hand: p.id === playerId ? p.hand : [],
      handCount: p.hand.length,
      isAI: p.isAI,
      isEliminated: p.isEliminated,
      isConnected: p.isConnected,
      revealedGarrisons: p.revealedGarrisons,
      stats: p.stats,
    })),
    board: state.board.map(tile => {
      const reveal = shouldRevealGarrison(tile, playerId, state);
      return {
        index: tile.index,
        name: tile.name,
        type: tile.type,
        purchaseCost: tile.purchaseCost,
        rentBase: tile.rentBase,
        buildingLevel: tile.buildingLevel,
        buildCosts: tile.buildCosts,
        owner: tile.owner,
        garrison: reveal ? tile.garrison : (tile.garrison.length > 0 ? "hidden" as const : []),
        garrisonCount: tile.garrison.length,
        hasFuseMine: tile.fuseMineOwner === playerId ? tile.hasFuseMine : false,
        fuseMineOwner: tile.fuseMineOwner === playerId ? tile.fuseMineOwner : null,
      };
    }),
    cardDeckCount: state.cardDeck.length,
    discardPile: state.discardPile,
    combatState: state.combatState,
    settings: state.settings,
    winner: state.winner,
  };
}
