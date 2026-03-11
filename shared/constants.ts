import type { CardType, Card, Tile, TileType, UnitType } from "./types";

export const UNIT_CONFIG: Record<UnitType, { cost: number; power: number }> = {
  infantry: { cost: 3, power: 1 },
  tank: { cost: 8, power: 3 },
  aircraft: { cost: 12, power: 5 },
};

export const BALANCE = {
  startingCoins: {
    classic: { 2: 60, 3: 50, 4: 40 } as Record<number, number>,
    blitz: { 2: 80, 3: 70 } as Record<number, number>,
  },
  supplyIncome: 10,
  taxAmount: 5,
  buildCosts: [5, 10, 20] as [number, number, number],
  rentMultiplier: { 0: 1, 1: 1.5, 2: 2, 3: 3 } as Record<number, number>,
  maxHandSize: 5,
  sellMultiplier: 0.5,
};

export const DECK_COMPOSITION: Record<CardType, number> = {
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
};

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
  military_investigation: { name: "Military Investigation", description: "Reveal garrison of one enemy territory", timing: "instant" },
  mobilisation_of_militia: { name: "Mobilisation of Militia", description: "Recruit 2 free infantry to reserve", timing: "instant" },
};

function makeTile(index: number, name: string, type: TileType, cost: number | null, rent: number | null): Tile {
  return {
    index, name, type,
    purchaseCost: cost, rentBase: rent,
    buildingLevel: 0, buildCosts: BALANCE.buildCosts,
    owner: null, garrison: [], hasFuseMine: false, fuseMineOwner: null,
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
