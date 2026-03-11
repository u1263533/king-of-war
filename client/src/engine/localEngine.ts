/**
 * Local game engine — runs entirely in the browser.
 * Mirrors server/src/gameState.ts logic but converts to client view types.
 */
import type {
  GameState, Tile, Unit, Card, CombatState, GameSettings,
  PlayerColor, UnitType, CardType,
} from "../types/game";
import { CLASSIC_BOARD, BLITZ_BOARD, UNIT_CONFIG, BALANCE, CARD_DEFINITIONS, BUILDING_NAMES } from "../utils/constants";
import { tTile } from "../utils/i18n";

// ─── Internal server-like types (garrison is always Unit[]) ───

interface ServerTile extends Omit<Tile, "garrison"> {
  garrison: Unit[];
  fuseMineOwner: string | null;
}

interface ServerPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  coins: number;
  position: number;
  previousPosition: number;
  ownedTerritories: number[];
  reservePool: Unit[];
  mobileArmy: Unit[];
  isAI: boolean;
  isEliminated: boolean;
  isConnected: boolean;
  stats: { battlesWon: number; battlesLost: number; territoriesCaptured: number; coinsEarned: number; unitsRecruited: number };
  hand: Card[];
  revealedGarrisons: number[];
}

interface ServerState {
  id: string;
  mode: "classic" | "blitz";
  status: "waiting" | "playing" | "ended";
  phase: "movement" | "action" | "management" | "combat" | "ended";
  currentPlayerIndex: number;
  turnNumber: number;
  doublesRolled: boolean;
  lastDiceRoll: number[] | null;
  players: ServerPlayer[];
  board: ServerTile[];
  cardDeck: Card[];
  discardPile: Card[];
  combatState: CombatState | null;
  settings: GameSettings;
  winner: string | null;
  log: string[];
}

// ─── Helpers ───

let unitCounter = 0;
function createUnit(type: UnitType): Unit {
  return { id: `unit-${++unitCounter}`, type, combatPower: UNIT_CONFIG[type].power };
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

const PLAYER_COLORS_ARR: PlayerColor[] = ["red", "blue", "yellow", "green"];

const DECK_COMPOSITION: Record<CardType, number> = {
  mercenary: 3, dummy_supplies: 3, fuse_mine: 2, land_tax: 3,
  war_fund: 3, surprise_attack: 2, surrounded: 2, transport_aircraft: 2,
  repressive: 3, mobilisation_of_militia: 4,
};

function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const [type, count] of Object.entries(DECK_COMPOSITION) as [CardType, number][]) {
    const def = CARD_DEFINITIONS[type];
    for (let i = 0; i < count; i++) {
      cards.push({ id: `card-${++id}`, type, timing: def.timing, name: def.name, description: def.description });
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function makeServerBoard(mode: "classic" | "blitz"): ServerTile[] {
  const src = mode === "blitz" ? BLITZ_BOARD : CLASSIC_BOARD;
  return src.map(t => ({ ...t, garrison: [] as Unit[], fuseMineOwner: null, hasFuseMine: false }));
}

const AI_NAMES = ["Commander Vex", "Warlord Ash", "General Rook"];

// ─── Create Game ───

export function createGame(settings: GameSettings): ServerState {
  const startCoins = 150;
  const players: ServerPlayer[] = [];
  for (let i = 0; i < settings.playerCount; i++) {
    players.push({
      id: `p${i}`,
      name: i === 0 ? "你" : AI_NAMES[i - 1] ?? `AI ${i}`,
      color: PLAYER_COLORS_ARR[i],
      coins: startCoins,
      position: 0,
      previousPosition: 0,
      ownedTerritories: [],
      reservePool: [],
      mobileArmy: [],
      hand: [],
      isAI: i > 0,
      isEliminated: false,
      isConnected: true,
      stats: { battlesWon: 0, battlesLost: 0, territoriesCaptured: 0, coinsEarned: 0, unitsRecruited: 0 },
      revealedGarrisons: [],
    });
  }
  return {
    id: crypto.randomUUID(),
    mode: settings.mode,
    status: "playing",
    phase: "movement",
    currentPlayerIndex: 0,
    turnNumber: 1,
    doublesRolled: false,
    lastDiceRoll: null,
    players,
    board: makeServerBoard(settings.mode),
    cardDeck: buildDeck(),
    discardPile: [],
    combatState: null,
    settings,
    winner: null,
    log: ["游戏开始！"],
  };
}

// ─── Convert server state → client GameState for a given player view ───

export function toClientState(s: ServerState, playerId: string): GameState {
  const viewer = s.players.find(p => p.id === playerId);
  return {
    id: s.id,
    mode: s.mode,
    status: s.status,
    phase: s.phase === "ended" ? "ended" : s.phase,
    currentPlayerIndex: s.currentPlayerIndex,
    turnNumber: s.turnNumber,
    doublesRolled: s.doublesRolled,
    lastDiceRoll: s.lastDiceRoll,
    players: s.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      coins: p.coins,
      position: p.position,
      previousPosition: p.previousPosition,
      ownedTerritories: p.ownedTerritories,
      reservePool: p.id === playerId ? p.reservePool : [],
      mobileArmy: p.mobileArmy,
      hand: p.id === playerId ? p.hand : p.hand.length,
      isAI: p.isAI,
      isEliminated: p.isEliminated,
      isConnected: p.isConnected,
      stats: p.stats,
    })),
    board: s.board.map(tile => {
      const reveal = tile.owner === playerId ||
        (viewer?.revealedGarrisons.includes(tile.index)) ||
        (s.combatState?.tileIndex === tile.index);
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
        hasFuseMine: tile.fuseMineOwner === playerId ? tile.hasFuseMine : false,
      };
    }),
    deckCount: s.cardDeck.length,
    discardCount: s.discardPile.length,
    combatState: s.combatState,
    settings: s.settings,
    winner: s.winner,
  };
}

// ─── Action dispatch ───

export type ActionResult = { error?: string; log?: string };

export function dispatch(s: ServerState, action: string, payload?: Record<string, unknown>): ActionResult {
  switch (action) {
    case "roll_dice": return rollDice(s);
    case "buy_territory": return buyTerritory(s);
    case "pass_buy": return passBuy(s);
    case "build": return build(s, payload?.tileIndex as number);
    case "recruit": return recruit(s, payload?.unitType as UnitType, payload?.count as number);
    case "deploy_mobile": return deployMobile(s, payload?.unitIds as string[]);
    case "deploy_garrison": return deployGarrison(s, payload?.unitIds as string[], payload?.tileIndex as number);
    case "end_management": return endManagement(s);
    case "sell_territory": return sellTerritory(s, payload?.tileIndex as number);
    case "play_card": return playCard(s, payload?.cardId as string, payload?.target as number | string | undefined);
    case "combat_choice": return combatChoice(s, payload?.choice as "military" | "costly" | "retreat");
    case "combat_play_card": return combatPlayCard(s, payload?.cardId as string);
    case "combat_ready": return combatReady(s);
    case "discard_card": return discardCard(s, payload?.cardId as string);
    default: return { error: `Unknown action: ${action}` };
  }
}

// ─── Actions ───

function rollDice(s: ServerState): ActionResult {
  if (s.phase !== "movement") return { error: "Not movement phase" };
  const d1 = rollDie();
  s.lastDiceRoll = [d1];
  s.doublesRolled = false;
  const player = s.players[s.currentPlayerIndex];
  const total = d1;
  const boardSize = s.board.length;
  const oldPos = player.position;
  const newPos = (oldPos + total) % boardSize;

  if (newPos < oldPos || (oldPos + total) >= boardSize) {
    player.coins += BALANCE.supplyIncome;
    s.log.push(`${player.name} 经过补给站 (+${BALANCE.supplyIncome} 金币)`);
  }

  player.previousPosition = oldPos;
  player.position = newPos;
  const tile = s.board[newPos];

  // Handle special tiles
  if (tile.type === "tax") {
    player.coins = Math.max(0, player.coins - BALANCE.taxAmount);
    s.log.push(`${player.name} 支付了 ${BALANCE.taxAmount} 税金`);
  }
  if (tile.type === "ammo_draw") {
    drawCard(s, player);
    s.log.push(`${player.name} 抽取了一张卡牌`);
  }
  if (tile.type === "recruitment") {
    player.reservePool.push(createUnit("infantry"));
    s.log.push(`${player.name} 免费招募了一名步兵`);
  }

  s.phase = "action";
  const logMsg = `${player.name} 掷出 ${d1}，移动到 ${tTile(tile.name)}`;
  s.log.push(logMsg);

  // Auto-resolve non-territory tiles
  if (tile.type !== "territory") {
    s.phase = "management";
  }
  // If enemy territory with garrison → need combat choice
  // If enemy territory without garrison → pay rent
  // If own territory → management
  // If unowned → can buy
  if (tile.type === "territory") {
    if (tile.owner === player.id) {
      s.phase = "management"; // own territory, skip to management
    } else if (tile.owner && tile.garrison.length > 0) {
      // Enemy with garrison → combat choice needed
      s.phase = "action";
    } else if (tile.owner && tile.garrison.length === 0) {
      // Enemy without garrison → auto-pay rent
      applyRent(s, player, tile);
      s.phase = "management";
    }
    // else unowned → action phase (can buy)
  }

  return { log: logMsg };
}

function drawCard(s: ServerState, player: ServerPlayer): void {
  if (player.hand.length >= BALANCE.maxHandSize) return;
  if (s.cardDeck.length === 0) {
    if (s.discardPile.length === 0) return;
    s.cardDeck = [...s.discardPile];
    s.discardPile = [];
    // shuffle
    for (let i = s.cardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s.cardDeck[i], s.cardDeck[j]] = [s.cardDeck[j], s.cardDeck[i]];
    }
  }
  const card = s.cardDeck.pop();
  if (card) player.hand.push(card);
}

function applyRent(s: ServerState, player: ServerPlayer, tile: ServerTile): void {
  const owner = s.players.find(p => p.id === tile.owner);
  if (!owner || !tile.rentBase) return;
  const multiplier = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
  const rent = Math.floor(tile.rentBase * multiplier);
  if (player.coins < rent) {
    player.isEliminated = true;
    owner.coins += player.coins;
    player.coins = 0;
    s.log.push(`${player.name} 破产了！已淘汰。`);
    checkVictory(s);
    return;
  }
  player.coins -= rent;
  owner.coins += rent;
  s.log.push(`${player.name} 向 ${owner.name} 支付了 ${rent} 租金`);
}

function checkVictory(s: ServerState): void {
  const alive = s.players.filter(p => !p.isEliminated);
  if (alive.length <= 1) {
    s.status = "ended";
    s.phase = "ended";
    s.winner = alive[0]?.id ?? null;
    if (alive[0]) s.log.push(`${alive[0].name} 赢得了游戏！`);
  }
}

function buyTerritory(s: ServerState): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];
  if (tile.type !== "territory") return { error: "Not a territory" };
  if (tile.owner !== null) return { error: "Already owned" };
  if (tile.purchaseCost !== null && player.coins < tile.purchaseCost) return { error: "Insufficient coins" };
  player.coins -= tile.purchaseCost!;
  tile.owner = player.id;
  player.ownedTerritories.push(tile.index);
  s.phase = "management";
  s.log.push(`${player.name} 以 ${tile.purchaseCost} 金币购买了 ${tTile(tile.name)}`);
  return { log: `Bought ${tTile(tile.name)}` };
}

function passBuy(s: ServerState): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];
  if (tile.type === "territory" && tile.owner && tile.owner !== player.id && tile.garrison.length === 0) {
    applyRent(s, player, tile);
  }
  s.phase = "management";
  return { log: "Passed" };
}

function build(s: ServerState, tileIndex: number): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];
  if (tile.owner !== player.id) return { error: "Not your territory" };
  if (tile.buildingLevel >= 3) return { error: "Max level" };
  const cost = tile.buildCosts[tile.buildingLevel as 0 | 1 | 2];
  if (player.coins < cost) return { error: "Insufficient coins" };
  player.coins -= cost;
  tile.buildingLevel = (tile.buildingLevel + 1) as 0 | 1 | 2 | 3;
  s.log.push(`${player.name} 在 ${tTile(tile.name)} 上建造了 ${BUILDING_NAMES[tile.buildingLevel]}`);
  return { log: `Built ${BUILDING_NAMES[tile.buildingLevel]}` };
}

function recruit(s: ServerState, unitType: UnitType, count: number, skipTileCheck = false): ActionResult {
  if (count <= 0) return { error: "Invalid count" };
  const player = s.players[s.currentPlayerIndex];
  if (!skipTileCheck) {
    const tile = s.board[player.position];
    if (tile.type !== "recruitment" && tile.type !== "supply_station") {
      return { error: "只能在征兵站或补给站招募部队" };
    }
  }
  const totalCost = UNIT_CONFIG[unitType].cost * count;
  if (player.coins < totalCost) return { error: "Insufficient coins" };
  player.coins -= totalCost;
  for (let i = 0; i < count; i++) player.reservePool.push(createUnit(unitType));
  player.stats.unitsRecruited += count;
  s.log.push(`${player.name} 招募了 ${count}x ${unitType}`);
  return { log: `Recruited ${count}x ${unitType}` };
}

function deployMobile(s: ServerState, unitIds: string[]): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    if (idx === -1) return { error: "Unit not in reserve" };
    const [unit] = player.reservePool.splice(idx, 1);
    player.mobileArmy.push(unit);
  }
  s.log.push(`${player.name} 部署了 ${unitIds.length} 个部队至机动部队`);
  return {};
}

function deployGarrison(s: ServerState, unitIds: string[], tileIndex: number): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];
  if (tile.type !== "territory") return { error: "无法在中立区域部署兵力" };
  if (tile.owner !== player.id) return { error: "Not your territory" };
  for (const id of unitIds) {
    const idx = player.reservePool.findIndex(u => u.id === id);
    if (idx === -1) return { error: "Unit not in reserve" };
    const [unit] = player.reservePool.splice(idx, 1);
    tile.garrison.push(unit);
  }
  s.log.push(`${player.name} 在 ${tTile(tile.name)} 驻扎了 ${unitIds.length} 个部队`);
  return {};
}

function sellTerritory(s: ServerState, tileIndex: number): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[tileIndex];
  if (tile.owner !== player.id) return { error: "Not your territory" };
  const sellPrice = Math.floor((tile.purchaseCost ?? 0) * BALANCE.sellMultiplier);
  player.coins += sellPrice;
  player.reservePool.push(...tile.garrison);
  tile.garrison = [];
  tile.owner = null;
  tile.buildingLevel = 0;
  player.ownedTerritories = player.ownedTerritories.filter(i => i !== tileIndex);
  s.log.push(`${player.name} 以 ${sellPrice} 金币出售了 ${tTile(tile.name)}`);
  return { log: `Sold for ${sellPrice}` };
}

function endManagement(s: ServerState): ActionResult {
  if (s.doublesRolled) {
    s.doublesRolled = false;
    s.phase = "movement";
    s.log.push("双骰奖励，额外行动一次！");
    return {};
  }
  const playerCount = s.players.length;
  let nextIdx = (s.currentPlayerIndex + 1) % playerCount;
  let loopCount = 0;
  while (s.players[nextIdx].isEliminated && loopCount < playerCount) {
    nextIdx = (nextIdx + 1) % playerCount;
    loopCount++;
  }
  if (nextIdx <= s.currentPlayerIndex) s.turnNumber++;
  s.currentPlayerIndex = nextIdx;
  s.phase = "movement";
  return {};
}

function playCard(s: ServerState, cardId: string, target?: number | string): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: "Card not in hand" };
  const card = player.hand[cardIdx];

  switch (card.type) {
    case "war_fund": player.coins += 4; break;
    case "land_tax": player.coins += player.ownedTerritories.length * 2; break;
    case "repressive": {
      const tp = s.players.find(p => p.id === target);
      if (tp) tp.coins = Math.max(0, tp.coins - 5);
      break;
    }
    case "mobilisation_of_militia":
      player.reservePool.push(createUnit("infantry"), createUnit("infantry"));
      break;
    case "transport_aircraft":
      player.previousPosition = player.position;
      player.position = target as number;
      break;
    case "fuse_mine": {
      const ti = target as number;
      s.board[ti].hasFuseMine = true;
      s.board[ti].fuseMineOwner = player.id;
      break;
    }
    default: break;
  }

  player.hand.splice(cardIdx, 1);
  s.discardPile.push(card);
  s.log.push(`${player.name} 使用了 ${card.name}`);
  return { log: `Played ${card.name}` };
}

function combatChoice(s: ServerState, choice: "military" | "costly" | "retreat"): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const tile = s.board[player.position];
  const owner = s.players.find(p => p.id === tile.owner);

  if (choice === "military") {
    if (player.mobileArmy.length === 0) return { error: "No mobile army" };
    s.combatState = {
      attackerId: player.id, defenderId: tile.owner!,
      tileIndex: player.position, phase: "card_play",
      attackerCards: [], defenderCards: [],
      attackerDice: null, defenderDice: null,
      attackerTotal: null, defenderTotal: null,
      result: null, attackerLosses: [], defenderLosses: [],
    };
    s.phase = "combat";
    s.log.push(`${player.name} 进攻 ${tTile(tile.name)}！`);
    return { log: "战斗开始！" };
  }
  if (choice === "costly" && tile.rentBase && owner) {
    const mult = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
    const rent = Math.floor(tile.rentBase * mult * 2);
    player.coins -= rent;
    owner.coins += rent;
    s.log.push(`${player.name} 支付了高额通行费 (${rent} 金币)`);
  }
  if (choice === "retreat" && tile.rentBase && owner) {
    const mult = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
    const rent = Math.floor(tile.rentBase * mult);
    player.coins -= rent;
    owner.coins += rent;
    s.log.push(`${player.name} 撤退并支付了 ${rent} 租金`);
  }
  s.combatState = null;
  s.phase = "management";
  return {};
}

function combatPlayCard(s: ServerState, cardId: string): ActionResult {
  if (!s.combatState) return { error: "No combat" };
  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: "Card not found" };
  const card = player.hand[cardIdx];
  player.hand.splice(cardIdx, 1);
  if (player.id === s.combatState.attackerId) {
    s.combatState.attackerCards.push(card);
  } else {
    s.combatState.defenderCards.push(card);
  }
  return {};
}

function combatReady(s: ServerState): ActionResult {
  if (!s.combatState) return { error: "No combat" };
  const combat = s.combatState;
  const attacker = s.players.find(p => p.id === combat.attackerId)!;
  const defender = s.players.find(p => p.id === combat.defenderId)!;
  const tile = s.board[combat.tileIndex];

  // Dice as base combat power — surprise_attack grants 3 dice
  let atkDiceCount = 2;
  if (combat.attackerCards.some(c => c.type === "surprise_attack")) atkDiceCount = 3;
  const attackerDice = Array.from({ length: atkDiceCount }, () => rollDie());
  const defenderDice = [rollDie(), rollDie()];

  const atkUnitPower = attacker.mobileArmy.reduce((sum, u) => sum + u.combatPower, 0);
  const defUnitPower = tile.garrison.reduce((sum, u) => sum + u.combatPower, 0);

  let atkCardBonus = 0, defCardBonus = 0;
  for (const c of combat.attackerCards) {
    if (c.type === "mercenary") atkCardBonus += 2;
    if (c.type === "dummy_supplies") atkCardBonus += 1;
  }
  for (const c of combat.defenderCards) {
    if (c.type === "mercenary") defCardBonus += 2;
    if (c.type === "dummy_supplies") defCardBonus += 1;
  }

  // Munitions Depot bonus: owner gets permanent +1 combat power
  const munitionsDepot = s.board.find(t => t.name === "Munitions Depot");
  let atkDepotBonus = 0, defDepotBonus = 0;
  if (munitionsDepot?.owner === attacker.id) { atkDepotBonus = 1; }
  if (munitionsDepot?.owner === defender.id) { defDepotBonus = 1; }

  const atkDiceSum = attackerDice.reduce((a, b) => a + b, 0);
  const defDiceSum = defenderDice.reduce((a, b) => a + b, 0);
  let attackerTotal = atkUnitPower + atkDiceSum + atkCardBonus + atkDepotBonus;
  const defenderTotal = defUnitPower + defDiceSum + defCardBonus + defDepotBonus;

  if (tile.hasFuseMine) {
    attackerTotal = Math.max(0, attackerTotal - 2);
    tile.hasFuseMine = false;
    tile.fuseMineOwner = null;
    s.log.push("引爆地雷触发！进攻方 -2。");
  }

  const result = attackerTotal > defenderTotal ? "attacker_wins" : "defender_wins";

  const diff = Math.abs(attackerTotal - defenderTotal);
  const lossCount = diff <= 3 ? 1 : diff <= 6 ? 2 : Infinity;
  let attackerLosses: Unit[] = [], defenderLosses: Unit[] = [];

  if (result === "attacker_wins") {
    const sorted = [...tile.garrison].sort((a, b) => a.combatPower - b.combatPower);
    defenderLosses = sorted.slice(0, Math.min(lossCount, sorted.length));
    tile.garrison = tile.garrison.filter(u => !defenderLosses.some(l => l.id === u.id));
    if (tile.garrison.length === 0) {
      defender.ownedTerritories = defender.ownedTerritories.filter(i => i !== tile.index);
      tile.owner = attacker.id;
      attacker.ownedTerritories.push(tile.index);
      attacker.stats.territoriesCaptured++;
      s.log.push(`${attacker.name} 占领了 ${tTile(tile.name)}！`);
    }
    attacker.stats.battlesWon++;
    defender.stats.battlesLost++;
  } else {
    const sorted = [...attacker.mobileArmy].sort((a, b) => a.combatPower - b.combatPower);
    attackerLosses = sorted.slice(0, Math.min(lossCount, sorted.length));
    attacker.mobileArmy = attacker.mobileArmy.filter(u => !attackerLosses.some(l => l.id === u.id));
    attacker.stats.battlesLost++;
    defender.stats.battlesWon++;
  }

  combat.phase = "resolution";
  combat.attackerDice = attackerDice;
  combat.defenderDice = defenderDice;
  combat.attackerTotal = attackerTotal;
  combat.defenderTotal = defenderTotal;
  combat.result = result;
  combat.attackerLosses = attackerLosses;
  combat.defenderLosses = defenderLosses;

  s.log.push(`战斗结果: ${result === "attacker_wins" ? attacker.name : defender.name} 获胜！(${attackerTotal} vs ${defenderTotal})`);

  return { log: result === "attacker_wins" ? "胜利！" : "战败！" };
}

function discardCard(s: ServerState, cardId: string): ActionResult {
  const player = s.players[s.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { error: "Card not found" };
  const [card] = player.hand.splice(cardIdx, 1);
  s.discardPile.push(card);
  return {};
}

// ─── AI Logic ───

export function runAITurn(s: ServerState): void {
  const player = s.players[s.currentPlayerIndex];
  if (!player.isAI || player.isEliminated) return;
  if (s.status === "ended") return;

  // Movement: roll dice
  if (s.phase === "movement") {
    rollDice(s);
  }

  // Action: buy if affordable, or combat choice
  if (s.phase === "action") {
    const tile = s.board[player.position];
    if (tile.type === "territory" && !tile.owner && tile.purchaseCost && player.coins >= tile.purchaseCost) {
      // Buy if we can still afford units afterward, or if we own few territories
      const coinsAfter = player.coins - tile.purchaseCost;
      if (player.ownedTerritories.length < 3 || coinsAfter >= 15) {
        buyTerritory(s);
      } else {
        passBuy(s);
      }
    } else if (tile.type === "territory" && tile.owner && tile.owner !== player.id && tile.garrison.length > 0) {
      // Smarter combat decision: compare actual power
      if (player.mobileArmy.length > 0) {
        const myPower = player.mobileArmy.reduce((sum, u) => sum + u.combatPower, 0);
        const enemyPower = tile.garrison.reduce((sum, u) => sum + u.combatPower, 0);
        // Attack if we have meaningful advantage (our units + avg dice ~7 vs their units + avg dice ~7)
        // So we attack if our unit power >= enemy unit power - 2, giving dice some room
        const hasSurprise = player.hand.some(c => c.type === "surprise_attack");
        const powerAdvantage = hasSurprise ? 3 : 0; // extra die averages ~3.5
        if (myPower + powerAdvantage >= enemyPower - 2) {
          combatChoice(s, "military");
        } else {
          // If rent is cheap enough, pay it; otherwise costly passage
          const mult = BALANCE.rentMultiplier[tile.buildingLevel] ?? 1;
          const rent = Math.floor((tile.rentBase ?? 0) * mult);
          if (rent <= player.coins * 0.15) {
            combatChoice(s, "retreat");
          } else {
            combatChoice(s, "retreat");
          }
        }
      } else {
        combatChoice(s, "retreat");
      }
    } else {
      passBuy(s);
    }
  }

  // Combat: auto-proceed (play combat cards first)
  if (s.phase === "combat" && s.combatState) {
    // Play surprise_attack if we're the attacker
    const surpriseCard = player.hand.find(c => c.type === "surprise_attack");
    if (surpriseCard && s.combatState.attackerId === player.id) {
      combatPlayCard(s, surpriseCard.id);
    }
    // Play mercenary if available
    const mercCard = player.hand.find(c => c.type === "mercenary");
    if (mercCard) combatPlayCard(s, mercCard.id);

    combatReady(s);
    // After resolution, go to management
    s.combatState = null;
    s.phase = "management";
  }

  // Management: smart AI decisions
  if (s.phase === "management") {
    const currentTile = s.board[player.position];
    const totalUnits = player.reservePool.length + player.mobileArmy.length;
    const ownedCount = player.ownedTerritories.length;

    // 1. Play instant cards first (get resources before spending)
    const instantCards = player.hand.filter(c => c.timing === "instant");
    for (const card of instantCards) {
      if (card.type === "war_fund") {
        playCard(s, card.id);
      } else if (card.type === "mobilisation_of_militia") {
        playCard(s, card.id);
      } else if (card.type === "land_tax" && ownedCount >= 2) {
        playCard(s, card.id);
      } else if (card.type === "repressive") {
        // Target richest enemy
        const enemies = s.players.filter(p => p.id !== player.id && !p.isEliminated);
        const richest = enemies.sort((a, b) => b.coins - a.coins)[0];
        if (richest) playCard(s, card.id, richest.id);
      } else if (card.type === "fuse_mine" && ownedCount > 0) {
        // Place on most valuable territory
        const bestTile = player.ownedTerritories
          .map(i => s.board[i])
          .sort((a, b) => (b.rentBase ?? 0) - (a.rentBase ?? 0))[0];
        if (bestTile && !bestTile.hasFuseMine) {
          playCard(s, card.id, bestTile.index);
        }
      }
    }

    // 2. Recruit units if on recruitment/supply_station tile
    if (currentTile.type === "recruitment" || currentTile.type === "supply_station") {
      // Decide what to buy based on economy
      const maxSpend = Math.floor(player.coins * 0.6); // spend at most 60% of coins
      const infantryCost = UNIT_CONFIG.infantry.cost;
      const tankCost = UNIT_CONFIG.tank.cost;
      const aircraftCost = UNIT_CONFIG.aircraft.cost;

      if (player.coins >= 80 && maxSpend >= aircraftCost && totalUnits < 8) {
        // Rich: buy aircraft
        recruit(s, "aircraft", 1, true);
      } else if (player.coins >= 40 && maxSpend >= tankCost && totalUnits < 8) {
        // Medium: buy tank
        recruit(s, "tank", 1, true);
      } else if (maxSpend >= infantryCost && totalUnits < 10) {
        // Budget: buy infantry — buy 2 if we can afford it and need units
        const count = (maxSpend >= infantryCost * 2 && totalUnits < 6) ? 2 : 1;
        recruit(s, "infantry", count, true);
      }
    }

    // 3. Deploy reserve to mobile army (keep a balanced mobile force)
    const desiredMobile = Math.max(3, Math.min(5, ownedCount)); // scale with territories
    if (player.reservePool.length > 0 && player.mobileArmy.length < desiredMobile) {
      const needed = desiredMobile - player.mobileArmy.length;
      const toMove = player.reservePool.slice(0, Math.min(needed, player.reservePool.length)).map(u => u.id);
      deployMobile(s, toMove);
    }

    // 4. Garrison undefended owned territories strategically
    // Prioritize high-value tiles (high rent, high building level)
    if (player.mobileArmy.length > 2 && ownedCount > 0) {
      const undefendedOwned = player.ownedTerritories
        .map(i => s.board[i])
        .filter(t => t.garrison.length === 0)
        .sort((a, b) => {
          const aVal = (a.rentBase ?? 0) * (BALANCE.rentMultiplier[a.buildingLevel] ?? 1);
          const bVal = (b.rentBase ?? 0) * (BALANCE.rentMultiplier[b.buildingLevel] ?? 1);
          return bVal - aVal; // highest value first
        });

      // Garrison up to 2 territories per turn, keeping at least 2 mobile units
      let garrisoned = 0;
      for (const uTile of undefendedOwned) {
        if (player.mobileArmy.length <= 2 || garrisoned >= 2) break;
        // Put weakest unit as garrison
        const sorted = [...player.mobileArmy].sort((a, b) => a.combatPower - b.combatPower);
        const weakest = sorted[0];
        const idx = player.mobileArmy.findIndex(u => u.id === weakest.id);
        if (idx >= 0) {
          const [unit] = player.mobileArmy.splice(idx, 1);
          uTile.garrison.push(unit);
          garrisoned++;
        }
      }
    }

    // 5. Also garrison from reserve pool directly to undefended territories
    if (player.reservePool.length > 0 && ownedCount > 0) {
      const undefended = player.ownedTerritories
        .map(i => s.board[i])
        .filter(t => t.garrison.length === 0);
      for (const uTile of undefended) {
        if (player.reservePool.length === 0) break;
        const unit = player.reservePool.shift()!;
        uTile.garrison.push(unit);
      }
    }

    // 6. Build on owned territories if affordable (prioritize highest rent territories)
    const buildCandidates = player.ownedTerritories
      .map(i => s.board[i])
      .filter(t => t.buildingLevel < 3)
      .sort((a, b) => (b.rentBase ?? 0) - (a.rentBase ?? 0));

    for (const tile of buildCandidates) {
      const cost = tile.buildCosts[tile.buildingLevel as 0 | 1 | 2];
      if (player.coins >= cost + 15) { // keep buffer for rent payments
        build(s, tile.index);
        break; // one build per turn
      }
    }

    endManagement(s);
  }
}

export type { ServerState };
