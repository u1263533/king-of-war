/** Maps tile names → asset image paths under /assets/tiles/ */
const TILE_IMAGE_MAP: Record<string, string> = {
  "Supply Station": "/assets/tiles/supply_station.png",
  "Ashfield Outskirts": "/assets/tiles/ashfield_outskirts.png",
  "Last Ammunition": "/assets/tiles/ammo_draw.png",
  "Dusthaven": "/assets/tiles/dusthaven.png",
  "Tax Office": "/assets/tiles/tax.png",
  "Trenchtown Village": "/assets/tiles/trenchtown_village.png",
  "Recruitment Post": "/assets/tiles/recruitment.png",
  "Scrapyard Junction": "/assets/tiles/scrapyard_junction.png",
  "Rustwall Crossing": "/assets/tiles/rustwall_crossing.png",
  "Ironclad City": "/assets/tiles/ironclad_city.png",
  "Munitions Depot": "/assets/tiles/munitions_depot.png",
  "Blackstone Ridge": "/assets/tiles/blackstone_ridge.png",
  "Frostfang Castle": "/assets/tiles/frostfang_castle.png",
  "Watchtower Heights": "/assets/tiles/watchtower_heights.png",
  "Greyshore Harbor": "/assets/tiles/greyshore_harbor.png",
  "Embervale Camp": "/assets/tiles/embervale_camp.png",
};

/** Fallback by tile type for special tiles */
const TILE_TYPE_IMAGE_MAP: Record<string, string> = {
  supply_station: "/assets/tiles/supply_station.png",
  ammo_draw: "/assets/tiles/ammo_draw.png",
  recruitment: "/assets/tiles/recruitment.png",
  tax: "/assets/tiles/tax.png",
  territory: "/assets/tiles/ashfield_outskirts.png",
};

export function getTileImage(tileName: string, tileType: string): string {
  return TILE_IMAGE_MAP[tileName] || TILE_TYPE_IMAGE_MAP[tileType] || "/assets/tiles/supply_station.png";
}

/** Maps card type → card art image */
export function getCardImage(cardType: string): string {
  return `/assets/cards/${cardType}.png`;
}

/** All selectable avatar options */
export const AVATAR_OPTIONS = [
  { id: "commander_wolf", name: "灰狼指挥官", path: "/assets/avatars/commander_wolf.png" },
  { id: "commander_eagle", name: "雄鹰指挥官", path: "/assets/avatars/commander_eagle.png" },
  { id: "commander_iron", name: "钢铁军阀", path: "/assets/avatars/commander_iron.png" },
  { id: "commander_fox", name: "赤狐特工", path: "/assets/avatars/commander_fox.png" },
  { id: "commander_bear", name: "熊皮将军", path: "/assets/avatars/commander_bear.png" },
  { id: "commander_hawk", name: "银鹰狙击手", path: "/assets/avatars/commander_hawk.png" },
  { id: "commander_storm", name: "风暴革命者", path: "/assets/avatars/commander_storm.png" },
  { id: "commander_viper", name: "毒蛇刺客", path: "/assets/avatars/commander_viper.png" },
  { id: "commander_titan", name: "泰坦老将", path: "/assets/avatars/commander_titan.png" },
  { id: "commander_phoenix", name: "凤凰战士", path: "/assets/avatars/commander_phoenix.png" },
  { id: "commander_ghost", name: "幽灵特战", path: "/assets/avatars/commander_ghost.png" },
  { id: "commander_dragon", name: "龙纹军阀", path: "/assets/avatars/commander_dragon.png" },
] as { id: string; name: string; path: string }[];

/** AI avatar assignments (fixed for AI players) */
const AI_AVATARS = [
  "/assets/avatars/commander_iron.png",
  "/assets/avatars/commander_bear.png",
  "/assets/avatars/commander_viper.png",
];

/** Selected player avatar — set by avatar selection screen */
let _playerAvatar = AVATAR_OPTIONS[0].path;

export function setPlayerAvatar(avatarId: string): void {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  if (found) _playerAvatar = found.path;
}

export function getPlayerAvatar(): string {
  return _playerAvatar;
}

/** Maps player color → avatar image. p0 uses selected avatar, AI uses fixed ones. */
export function getAvatarImage(color: string): string {
  // Map by player color to their avatar
  switch (color) {
    case "red": return _playerAvatar; // player is always red (p0)
    case "blue": return AI_AVATARS[0];
    case "yellow": return AI_AVATARS[1];
    case "green": return AI_AVATARS[2];
    default: return _playerAvatar;
  }
}

/** Combat background */
export const COMBAT_BG = "/assets/scenes/combat_bg.png";
