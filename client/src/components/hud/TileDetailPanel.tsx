import { useGameStore } from "../../stores/gameStore";
import { PLAYER_COLORS, BUILDING_NAMES, BALANCE, UNIT_CONFIG } from "../../utils/constants";
import { t, tTile } from "../../utils/i18n";
import type { Unit } from "../../types/game";

/** Special effect descriptions for non-territory tiles */
const TILE_EFFECTS: Record<string, string> = {
  supply_station: "中立区域。经过时获得补给金币，可在此招募部队。",
  recruitment: "中立区域。经过时免费获得一名步兵，可在此招募部队。",
  ammo_draw: "中立区域。经过时抽取一张弹药卡牌。",
  tax: "中立区域。经过时需缴纳税金。",
};

/** Munitions Depot special effect */
const MUNITIONS_DEPOT_EFFECT = "拥有军火库的一方在所有战斗中永久 +1 战斗力。";

/** Lore / backstory for territory tiles */
const TILE_LORE: Record<string, string> = {
  "Ashfield Outskirts": "曾经繁华的城镇边缘，如今只剩焦黑的废墟和零星的幸存者。灰烬覆盖了一切，但地下的资源仍然丰富。",
  "Dusthaven": "沙尘暴频发的避难所，商人们冒着生命危险在此交易稀缺物资。谁控制了尘雾港湾，谁就掌握了贸易命脉。",
  "Trenchtown Village": "建在旧战壕上的村庄，居民以坚韧著称。层层战壕构成天然防线，易守难攻。",
  "Scrapyard Junction": "各方势力争夺的废铁回收站，无数废弃武器和车辆可被改造利用。控制此地能大幅增强军备。",
  "Rustwall Crossing": "一座被锈蚀铁墙包围的关卡，是连接东西区域的必经之路。过往商队须缴纳高额通行费。",
  "Ironclad City": "末世中仅存的大型堡垒城市，以厚重的铁甲城墙闻名。城内有完善的军工设施，是兵家必争之地。",
  "Munitions Depot": "储存着大量弹药和武器的军火库，控制此地的势力在战斗中拥有额外火力支持。",
  "Blackstone Ridge": "黑色岩石构成的险要山脊，居高临下的地势使其成为理想的防御据点。",
  "Frostfang Castle": "建于冰封山巅的古堡，寒冷的气候令进攻者苦不堪言，守军却能凭借城堡的坚固工事安然无恙。",
  "Watchtower Heights": "制高点上的瞭望塔群，可监视方圆数十里的动静。掌控这里就掌控了战场情报。",
  "Greyshore Harbor": "灰色海岸边的港口，是海上补给线的关键节点。港口虽然简陋，但战略位置无可替代。",
  "Embervale Camp": "位于余烬山谷中的军营，火山灰肥沃的土地养活着驻军。温暖的地热为将士们提供了难得的舒适。",
};

export function TileDetailPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  if (!gameState || selectedTile === null) {
    return (
      <aside className="w-56 shrink-0 p-3 border-l border-army-light/20 flex items-center justify-center">
        <p className="text-khaki/30 text-xs text-center">{t("Click a tile to inspect")}</p>
      </aside>
    );
  }

  const tile = gameState.board[selectedTile];
  if (!tile) return null;

  const owner = gameState.players.find((p) => p.id === tile.owner);
  const isOwn = tile.owner === myPlayerId;
  const rentAmount = tile.rentBase
    ? Math.round(tile.rentBase * BALANCE.rentMultiplier[tile.buildingLevel])
    : null;

  const isMunitionsDepot = tile.name === "Munitions Depot";
  const hasSpecialEffect = tile.type !== "territory" || isMunitionsDepot;
  const effectText = isMunitionsDepot ? MUNITIONS_DEPOT_EFFECT : TILE_EFFECTS[tile.type];
  const loreText = TILE_LORE[tile.name];

  return (
    <aside className="w-56 shrink-0 p-3 border-l border-army-light/20 overflow-y-auto animate-slide-in-right">
      {/* Tile name */}
      <h3 className="font-stencil text-gold text-sm tracking-wider mb-1">{tTile(tile.name)}</h3>
      <div className="text-[10px] text-khaki/40 uppercase tracking-wider mb-3">
        {tile.type !== "territory" ? "中立区域" : t(tile.type.replace("_", " "))}
      </div>

      {/* Special effect description */}
      {hasSpecialEffect && effectText && (
        <div className="mb-3 p-2 rounded bg-gold/5 border border-gold/20">
          <div className="text-[10px] text-gold tracking-wider mb-1 font-stencil">特殊效果</div>
          <p className="text-xs text-cream/80 leading-relaxed">{effectText}</p>
        </div>
      )}

      {/* Owner */}
      {owner && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: PLAYER_COLORS[owner.color] }} />
          <span className="text-sm text-cream">{owner.name}</span>
          {isOwn && <span className="text-[10px] text-gold bg-gold/10 px-1 rounded">{t("YOURS")}</span>}
        </div>
      )}

      {/* Territory details */}
      {tile.type === "territory" && (
        <div className="space-y-2 mb-3">
          {!tile.owner && tile.purchaseCost && (
            <div className="flex justify-between text-xs">
              <span className="text-khaki/50">{t("Purchase Cost")}</span>
              <span className="text-gold font-bold">{tile.purchaseCost} &#9733;</span>
            </div>
          )}
          {tile.rentBase && (
            <div className="flex justify-between text-xs">
              <span className="text-khaki/50">{t("Base Rent")}</span>
              <span className="text-cream">{tile.rentBase}</span>
            </div>
          )}
          {rentAmount && tile.owner && (
            <div className="flex justify-between text-xs">
              <span className="text-khaki/50">{t("Current Rent")}</span>
              <span className="text-gold font-bold">{rentAmount} &#9733;</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-khaki/50">{t("Building")}</span>
            <span className="text-cream">{t(BUILDING_NAMES[tile.buildingLevel])}</span>
          </div>

          {/* Build costs for own unbuilt territory */}
          {isOwn && tile.buildingLevel < 3 && (
            <div className="mt-2 p-2 rounded bg-army-dark/50 border border-army-light/20">
              <div className="text-[10px] text-khaki/40 mb-1">UPGRADE TO {t(BUILDING_NAMES[tile.buildingLevel + 1]).toUpperCase()}</div>
              <div className="text-xs text-gold">{tile.buildCosts[tile.buildingLevel as 0 | 1 | 2]} &#9733;</div>
            </div>
          )}
        </div>
      )}

      {/* Garrison info */}
      {tile.owner && (
        <div className="mt-3 pt-3 border-t border-army-light/20">
          <div className="text-[10px] text-khaki/40 tracking-wider mb-2">{t("GARRISON")}</div>
          {tile.garrison === "hidden" ? (
            <div className="flex items-center gap-2 p-2 rounded bg-danger/10 border border-danger/20">
              <span className="text-danger text-lg">?</span>
              <span className="text-xs text-khaki/50">{t("Unknown forces")}</span>
            </div>
          ) : Array.isArray(tile.garrison) && tile.garrison.length > 0 ? (
            <div className="space-y-1">
              {Object.entries(
                (tile.garrison as Unit[]).reduce((acc, u) => {
                  acc[u.type] = (acc[u.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="text-khaki/60">
                    {UNIT_CONFIG[type as Unit["type"]].icon} {t(UNIT_CONFIG[type as Unit["type"]].label)}
                  </span>
                  <span className="text-cream">{count} ({t("Power")}: {count * UNIT_CONFIG[type as Unit["type"]].power})</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-khaki/30 italic">{t("Undefended")}</div>
          )}
        </div>
      )}

      {/* Fuse Mine indicator (own only) */}
      {tile.hasFuseMine && isOwn && (
        <div className="mt-2 p-2 rounded bg-danger/10 border border-danger/20">
          <div className="text-xs text-danger-light flex items-center gap-1">
            <span>&#128163;</span> {t("Fuse Mine Active")}
          </div>
        </div>
      )}

      {/* Lore / backstory for territory tiles */}
      {loreText && !hasSpecialEffect && (
        <div className="mt-3 pt-3 border-t border-army-light/10">
          <div className="text-[10px] text-khaki/30 tracking-wider mb-1 font-stencil">背景故事</div>
          <p className="text-xs text-khaki/50 leading-relaxed italic">{loreText}</p>
        </div>
      )}
      {/* Munitions Depot also gets lore */}
      {loreText && isMunitionsDepot && (
        <div className="mt-3 pt-3 border-t border-army-light/10">
          <div className="text-[10px] text-khaki/30 tracking-wider mb-1 font-stencil">背景故事</div>
          <p className="text-xs text-khaki/50 leading-relaxed italic">{loreText}</p>
        </div>
      )}
    </aside>
  );
}
