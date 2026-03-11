import { useGameStore } from "../../stores/gameStore";
import { PLAYER_COLORS, UNIT_CONFIG } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { getAvatarImage } from "../../utils/assetMap";
import type { Player, Unit } from "../../types/game";

function UnitBadge({ units }: { units: Unit[] }) {
  const grouped = units.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex gap-1.5 flex-wrap">
      {Object.entries(grouped).map(([type, count]) => (
        <span key={type} className="text-xs bg-army-dark/50 px-1.5 py-0.5 rounded text-khaki/70">
          {UNIT_CONFIG[type as Unit["type"]].icon}{count}
        </span>
      ))}
    </div>
  );
}

function PlayerCard({ player, isMe, isActive }: { player: Player; isMe: boolean; isActive: boolean }) {
  const color = PLAYER_COLORS[player.color];

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isActive
          ? "border-gold/50 bg-army/80 shadow-lg shadow-gold/5"
          : player.isEliminated
          ? "border-army-light/10 bg-army-dark/30 opacity-50"
          : "border-army-light/20 bg-army/40"
      }`}
    >
      {/* Name row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img
            src={getAvatarImage(player.color)}
            alt=""
            className="w-8 h-8 rounded-full shrink-0 object-cover border-2"
            style={{ borderColor: color }}
          />
          <span className={`text-sm font-stencil tracking-wider ${isActive ? "text-gold" : "text-cream"}`}>
            {player.name}
          </span>
          {player.isAI && <span className="text-[10px] text-army-lighter bg-army-dark/50 px-1 rounded">AI</span>}
          {isMe && <span className="text-[10px] text-gold bg-gold/10 px-1 rounded">{t("YOU")}</span>}
        </div>
        {player.isEliminated && <span className="text-[10px] text-danger font-stencil">{t("BANKRUPT")}</span>}
      </div>

      {!player.isEliminated && (
        <>
          {/* Economy */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-khaki/50">{t("Coins")}</span>
            <span className="text-gold font-bold">{player.coins} &#9733;</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-khaki/50">{t("Territories")}</span>
            <span className="text-cream">{player.ownedTerritories.length}</span>
          </div>

          {/* Cards (count only for others) */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-khaki/50">{t("Cards")}</span>
            <span className="text-cream">{typeof player.hand === "number" ? player.hand : player.hand.length}/5</span>
          </div>

          {/* Mobile army */}
          {player.mobileArmy.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-khaki/40 mb-1">{t("MOBILE ARMY")}</div>
              <UnitBadge units={player.mobileArmy} />
            </div>
          )}

          {/* Reserve (only for self) */}
          {isMe && player.reservePool.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-khaki/40 mb-1">{t("RESERVE")}</div>
              <UnitBadge units={player.reservePool} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PlayerPanelSidebar() {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  if (!gameState) return null;

  return (
    <aside className="w-52 shrink-0 p-2 space-y-2 overflow-y-auto border-r border-army-light/20">
      <div className="text-[10px] text-khaki/40 font-stencil tracking-widest px-1 mb-1">{t("WARLORDS")}</div>
      {gameState.players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isMe={player.id === myPlayerId}
          isActive={gameState.players.indexOf(player) === gameState.currentPlayerIndex}
        />
      ))}
    </aside>
  );
}
