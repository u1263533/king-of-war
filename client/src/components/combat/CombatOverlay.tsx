import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { PLAYER_COLORS, UNIT_CONFIG } from "../../utils/constants";
import { t, tTile } from "../../utils/i18n";
import { getAvatarImage, COMBAT_BG } from "../../utils/assetMap";
import { playDiceRoll, playCombatStart, playVictory, playDefeat, playExplosion, playButtonClick } from "../../utils/sounds";
import type { Unit } from "../../types/game";

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-lg border-2 border-gold/50 bg-army flex items-center justify-center
                     text-2xl font-stencil text-cream ${rolling ? "animate-dice-roll animate-shake" : ""}`}>
      {rolling ? "?" : value}
    </div>
  );
}

function UnitRow({ units, label }: { units: Unit[]; label: string }) {
  const grouped = units.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPower = units.reduce((s, u) => s + u.combatPower, 0);

  return (
    <div>
      <div className="text-[10px] text-khaki/40 tracking-wider mb-1">{label}</div>
      {units.length === 0 ? (
        <div className="text-xs text-khaki/30 italic">No units</div>
      ) : (
        <div className="space-y-1">
          {Object.entries(grouped).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-cream">
                {UNIT_CONFIG[type as Unit["type"]].icon} {t(UNIT_CONFIG[type as Unit["type"]].label)} x{count}
              </span>
              <span className="text-khaki/60">{t("Power")}: {count * UNIT_CONFIG[type as Unit["type"]].power}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 pt-1 border-t border-army-light/20 text-sm font-stencil text-gold">
        Total: {totalPower}
      </div>
    </div>
  );
}

export function CombatOverlay() {
  const gameState = useGameStore((s) => s.gameState);
  const setShowCombat = useGameStore((s) => s.setShowCombat);
  const doAction = useGameStore((s) => s.doAction);
  const endCombat = useGameStore((s) => s.endCombat);
  const [rolling, setRolling] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  if (!gameState || !gameState.combatState) {
    return (
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-army-dark border-2 border-gold/30 rounded-xl p-6 max-w-md w-full mx-4 text-center animate-bounce-in">
          <h2 className="font-stencil text-2xl text-gold mb-4">{t("NO ACTIVE BATTLE")}</h2>
          <button
            onClick={() => setShowCombat(false)}
            className="px-6 py-2 bg-gold text-army-dark font-stencil rounded hover:bg-khaki transition-all"
          >
            {t("CLOSE")}
          </button>
        </div>
      </div>
    );
  }

  const combat = gameState.combatState;
  const attacker = gameState.players.find(p => p.id === combat.attackerId);
  const defender = gameState.players.find(p => p.id === combat.defenderId);
  const tile = gameState.board[combat.tileIndex];

  if (!attacker || !defender) return null;

  const hasResult = combat.result !== null;
  const winner = combat.result === "attacker_wins" ? "attacker" : combat.result === "defender_wins" ? "defender" : null;
  const munitionsDepotTile = gameState.board.find(t => t.name === "Munitions Depot");
  const attackerHasDepot = munitionsDepotTile?.owner === combat.attackerId;
  const defenderHasDepot = munitionsDepotTile?.owner === combat.defenderId;

  const handleRollDice = () => {
    playDiceRoll();
    playCombatStart();
    setRolling(true);
    setTimeout(() => {
      doAction("combat_ready");
      setRolling(false);
      setResolved(true);
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);
      const state = useGameStore.getState().gameState;
      if (state?.combatState?.result === "attacker_wins") {
        playVictory();
      } else {
        playDefeat();
      }
      if (tile.hasFuseMine) {
        playExplosion();
      }
    }, 1500);
  };

  const handleContinue = () => {
    setResolved(false);
    endCombat();
  };

  // Get garrison units - could be hidden or revealed
  const garrisonUnits = Array.isArray(tile.garrison) ? tile.garrison : [];

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 animate-fade-in">
      {/* Flash overlay for result reveal */}
      {showFlash && (
        <div className="fixed inset-0 z-[60] pointer-events-none animate-flash" />
      )}

      <div className="relative bg-army-dark border-2 border-gold/30 rounded-xl overflow-hidden max-w-4xl w-full mx-4 shadow-2xl shadow-gold/5 animate-bounce-in">
        {/* Combat background image */}
        <img src={COMBAT_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

        <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-stencil text-3xl text-gold tracking-wider drop-shadow-lg">{t("BATTLE")}</h2>
          <div className="text-sm text-khaki/50">
            at <span className="text-cream font-stencil">{tTile(tile.name)}</span>
          </div>
          <button
            onClick={() => setShowCombat(false)}
            className="text-khaki/40 hover:text-khaki text-xl transition-colors"
          >
            &#10005;
          </button>
        </div>

        {/* Combat area */}
        <div className="flex gap-6">
          {/* Attacker side */}
          <div className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            winner === "attacker" ? "border-gold bg-gold/5 animate-glow-pulse" :
            winner === "defender" ? "border-danger/30 bg-danger/5 opacity-60" :
            "border-army-light/30 bg-army/50"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <img src={getAvatarImage(attacker.color)} alt="" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: PLAYER_COLORS[attacker.color] }} />
              <div>
                <span className="font-stencil text-lg text-cream tracking-wider block">{t("ATTACKER")}</span>
                <span className="text-sm text-cream/70">{attacker.name}</span>
              </div>
            </div>
            <UnitRow units={attacker.mobileArmy} label={t("MOBILE ARMY")} />

            {combat.attackerCards.length > 0 && (
              <div className="mt-2 text-xs text-gold">
                {t("Cards")}: {combat.attackerCards.map(c => t(c.name)).join(", ")}
              </div>
            )}
            {attackerHasDepot && (
              <div className="mt-1 text-xs text-gold/80">军火库加成 +1</div>
            )}

            {/* Dice */}
            {(rolling || hasResult) && (
              <div className={`mt-4 pt-4 border-t border-army-light/20 ${rolling ? "animate-shake" : ""}`}>
                <div className="flex gap-2 mb-2">
                  {(rolling ? Array(combat.attackerCards.some(c => c.type === "surprise_attack") ? 3 : 2).fill(0) : (combat.attackerDice ?? [])).map((d, i) => (
                    <DiceFace key={i} value={d} rolling={rolling} />
                  ))}
                </div>
                {hasResult && (
                  <div className="text-lg font-stencil text-gold">
                    {t("总战力")}: {combat.attackerTotal}
                  </div>
                )}
              </div>
            )}

            {winner === "attacker" && (
              <div className="mt-3 text-center font-stencil text-gold text-xl animate-slide-up">{t("VICTORY")}!</div>
            )}
          </div>

          {/* VS */}
          <div className="flex items-center">
            <div className="font-stencil text-5xl text-danger/60">VS</div>
          </div>

          {/* Defender side */}
          <div className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            winner === "defender" ? "border-gold bg-gold/5 animate-glow-pulse" :
            winner === "attacker" ? "border-danger/30 bg-danger/5 opacity-60" :
            "border-army-light/30 bg-army/50"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <img src={getAvatarImage(defender.color)} alt="" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: PLAYER_COLORS[defender.color] }} />
              <div>
                <span className="font-stencil text-lg text-cream tracking-wider block">{t("DEFENDER")}</span>
                <span className="text-sm text-cream/70">{defender.name}</span>
              </div>
            </div>

            {!hasResult && !rolling ? (
              <div className="p-3 rounded bg-danger/10 border border-danger/20">
                <div className="text-sm text-khaki/50 mb-1">{t("GARRISON")}: HIDDEN</div>
                <div className="text-2xl text-danger text-center font-stencil">?</div>
              </div>
            ) : (
              <UnitRow units={garrisonUnits} label={t("GARRISON")} />
            )}

            {combat.defenderCards.length > 0 && (
              <div className="mt-2 text-xs text-gold">
                {t("Cards")}: {combat.defenderCards.map(c => t(c.name)).join(", ")}
              </div>
            )}
            {defenderHasDepot && (
              <div className="mt-1 text-xs text-gold/80">军火库加成 +1</div>
            )}

            {/* Dice */}
            {(rolling || hasResult) && (
              <div className={`mt-4 pt-4 border-t border-army-light/20 ${rolling ? "animate-shake" : ""}`}>
                <div className="flex gap-2 mb-2">
                  {(rolling ? [0, 0] : (combat.defenderDice ?? [])).map((d, i) => (
                    <DiceFace key={i} value={d} rolling={rolling} />
                  ))}
                </div>
                {hasResult && (
                  <div className="text-lg font-stencil text-gold">
                    {t("总战力")}: {combat.defenderTotal}
                  </div>
                )}
              </div>
            )}

            {winner === "defender" && (
              <div className="mt-3 text-center font-stencil text-gold text-xl animate-slide-up">{t("HOLDS!")}</div>
            )}
          </div>
        </div>

        {/* Fuse Mine explosion indicator */}
        {tile.hasFuseMine && hasResult && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-explosion text-4xl">&#128163;</div>
            <span className="ml-2 font-stencil text-danger text-sm">{t("Fuse Mine")}!</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {!rolling && !hasResult && (
            <button
              onClick={handleRollDice}
              className="px-8 py-3 bg-gold text-army-dark font-stencil text-lg tracking-wider rounded
                         hover:bg-khaki transition-all active:scale-95"
            >
              {t("ROLL DICE")}
            </button>
          )}

          {rolling && (
            <div className="text-center font-stencil text-gold text-xl tracking-wider animate-pulse">
              {t("Rolling...")}
            </div>
          )}

          {hasResult && resolved && (
            <button
              onClick={() => { playButtonClick(); handleContinue(); }}
              className="px-8 py-3 bg-gold text-army-dark font-stencil text-lg tracking-wider rounded
                         hover:bg-khaki transition-all active:scale-95"
            >
              {t("CONTINUE")}
            </button>
          )}
        </div>
        </div>{/* end z-10 content wrapper */}
      </div>
    </div>
  );
}
