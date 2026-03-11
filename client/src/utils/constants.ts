import type { Card, CardType, Tile, TileType, UnitType } from "../types/game";

export const PLAYER_COLORS = {
  red: "#c94c4c",
  blue: "#4c7cc9",
  yellow: "#c9b84c",
  green: "#4cc96a",
} as const;

export const UNIT_CONFIG: Record<UnitType, { cost: number; power: number; label: string; icon: string }> = {
  infantry: { cost: 3, power: 1, label: "Infantry", icon: "🎖" },
  tank: { cost: 8, power: 3, label: "Tank", icon: "🛡" },
  aircraft: { cost: 12, power: 5, label: "Aircraft", icon: "✈" },
};

export const BALANCE = {
  classic: { 2: 60, 3: 50, 4: 40 } as Record<number, number>,
  blitz: { 2: 80, 3: 70 } as Record<number, number>,
  supplyIncome: 10,
  taxAmount: 5,
  buildCosts: [5, 10, 20] as [number, number, number],
  rentMultiplier: { 0: 1, 1: 1.5, 2: 2, 3: 3 } as Record<number, number>,
  maxHandSize: 5,
  sellMultiplier: 0.5,
};

export const BUILDING_NAMES = ["None", "Outpost", "Fortress", "Stronghold"];
export const BUILDING_ICONS = ["", "▲", "◆", "★"];

export const CARD_DEFINITIONS: Record<CardType, { name: string; description: string; timing: Card["timing"] }> = {
  mercenary: { name: "Mercenary", description: "+2 combat power for this battle", timing: "combat" },
  dummy_supplies: { name: "Dummy Supplies", description: "+1 combat power for this battle", timing: "combat" },
  fuse_mine: { name: "Fuse Mine", description: "Place trap on territory. Attacker takes -2", timing: "defense" },
  land_tax: { name: "Land Tax", description: "Collect 2 coins per owned territory", timing: "instant" },
  war_fund: { name: "War Fund", description: "Receive 4 coins immediately", timing: "instant" },
  surprise_attack: { name: "Surprise Attack", description: "Roll 3 dice instead of 2 when attacking", timing: "combat" },
  surrounded: { name: "Surrounded", description: "Enemy cannot retreat from battle", timing: "combat" },
  transport_aircraft: { name: "Transport Aircraft", description: "Teleport to any tile on the board", timing: "movement" },
  repressive: { name: "Repressive", description: "Target player loses 5 coins", timing: "instant" },
  mobilisation_of_militia: { name: "Mobilisation of Militia", description: "Recruit 2 free infantry to reserve", timing: "instant" },
};

export const CARD_TYPE_COLORS: Record<Card["timing"], string> = {
  combat: "#c94c4c",
  instant: "#d4a847",
  defense: "#4c7cc9",
  movement: "#4cc96a",
};

export const TILE_TYPE_COLORS: Record<TileType, string> = {
  territory: "#3d4a2a",
  supply_station: "#4a6a3a",
  ammo_draw: "#5a4a2a",
  recruitment: "#3a4a5a",
  tax: "#5a3a3a",
};

export const TILE_TYPE_ICONS: Record<TileType, string> = {
  territory: "",
  supply_station: "⛺",
  ammo_draw: "🎴",
  recruitment: "⚔",
  tax: "💰",
};

function makeTile(index: number, name: string, type: TileType, cost: number | null, rent: number | null): Tile {
  return {
    index, name, type,
    purchaseCost: cost, rentBase: rent,
    buildingLevel: 0, buildCosts: BALANCE.buildCosts,
    owner: null, garrison: [], hasFuseMine: false,
  };
}

export const CLASSIC_BOARD: Tile[] = [
  makeTile(0,  "Supply Station",     "supply_station", null, null),
  makeTile(1,  "Ashfield Outskirts", "territory",      8,    2),
  makeTile(2,  "Last Ammunition",    "ammo_draw",      null, null),
  makeTile(3,  "Dusthaven",          "territory",      10,   3),
  makeTile(4,  "Tax Office",         "tax",            null, null),
  makeTile(5,  "Trenchtown Village", "territory",      12,   4),
  makeTile(6,  "Recruitment Post",   "recruitment",    null, null),
  makeTile(7,  "Scrapyard Junction", "territory",      14,   4),
  makeTile(8,  "Rustwall Crossing",  "territory",      16,   5),
  makeTile(9,  "Last Ammunition",    "ammo_draw",      null, null),
  makeTile(10, "Ironclad City",      "territory",      20,   7),
  makeTile(11, "Munitions Depot",    "territory",      18,   6),
  makeTile(12, "Recruitment Post",   "recruitment",    null, null),
  makeTile(13, "Blackstone Ridge",   "territory",      22,   8),
  makeTile(14, "Frostfang Castle",   "territory",      26,   10),
  makeTile(15, "Last Ammunition",    "ammo_draw",      null, null),
  makeTile(16, "Watchtower Heights", "territory",      24,   9),
  makeTile(17, "Tax Office",         "tax",            null, null),
  makeTile(18, "Greyshore Harbor",   "territory",      15,   5),
  makeTile(19, "Embervale Camp",     "territory",      10,   3),
];

export const BLITZ_BOARD: Tile[] = [
  makeTile(0, "Supply Station",     "supply_station", null, null),
  makeTile(1, "Dusthaven",          "territory",      10,   3),
  makeTile(2, "Last Ammunition",    "ammo_draw",      null, null),
  makeTile(3, "Trenchtown Village", "territory",      14,   5),
  makeTile(4, "Recruitment Post",   "recruitment",    null, null),
  makeTile(5, "Ironclad City",      "territory",      22,   8),
  makeTile(6, "Frostfang Castle",   "territory",      28,   11),
  makeTile(7, "Last Ammunition",    "ammo_draw",      null, null),
  makeTile(8, "Blackstone Ridge",   "territory",      18,   6),
  makeTile(9, "Tax Office",         "tax",            null, null),
];

export const QUICK_MESSAGES = [
  "Good move!",
  "I'm coming for you!",
  "Nice battle!",
  "Let's team up",
  "Watch your back!",
  "Prepare for war!",
];
