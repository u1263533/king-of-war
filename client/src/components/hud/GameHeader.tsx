import { useGameStore } from "../../stores/gameStore";
import { PLAYER_COLORS } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { playButtonClick } from "../../utils/sounds";

export function GameHeader() {
  const gameState = useGameStore((s) => s.gameState);
  const toggleHowToPlay = useGameStore((s) => s.toggleHowToPlay);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phaseLabels: Record<string, string> = {
    movement: t("MOVEMENT"),
    action: t("ACTION"),
    management: t("MANAGEMENT"),
    combat: t("COMBAT"),
    ended: t("GAME OVER"),
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-army border-b border-army-light/30 shrink-0">
      {/* Left: Game info */}
      <div className="flex items-center gap-4">
        <h1 className="font-stencil text-lg text-gold tracking-wider hidden sm:block" style={{ textShadow: "0 0 10px rgba(212, 168, 71, 0.3)" }}>{t("KING OF WAR")}</h1>
        <div className="h-5 w-px bg-army-light/30 hidden sm:block" />
        <span className="text-khaki/60 text-sm">{t("Turn")} {gameState.turnNumber}</span>
        <span className="text-khaki/40 text-xs uppercase">{gameState.mode === "classic" ? t("Classic") : t("Blitz")}</span>
      </div>

      {/* Center: Current player & phase */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: PLAYER_COLORS[currentPlayer.color], boxShadow: `0 0 8px ${PLAYER_COLORS[currentPlayer.color]}` }} />
        <span className="text-cream font-stencil tracking-wider text-sm animate-fade-in" key={`${gameState.turnNumber}-${gameState.currentPlayerIndex}`}>
          {currentPlayer.name === "你" ? t("Your Turn") : `${currentPlayer.name}${t("'s Turn")}`}
        </span>
        <span className="px-3 py-0.5 bg-gold/15 text-gold text-xs font-stencil tracking-wider rounded animate-phase-sweep border border-gold/20" key={`${gameState.phase}-${gameState.turnNumber}`}>
          {phaseLabels[gameState.phase]}
        </span>
        {gameState.doublesRolled && (
          <span className="px-2 py-0.5 bg-danger/20 text-danger-light text-xs rounded animate-shake font-stencil">
            {t("DOUBLES!")}
          </span>
        )}
      </div>

      {/* Right: Timer & controls */}
      <div className="flex items-center gap-3">
        {gameState.settings.turnTimer > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold font-stencil text-sm">0:42</span>
          </div>
        )}
        <button
          onClick={() => { playButtonClick(); toggleHowToPlay(); }}
          className="text-khaki/50 hover:text-khaki text-xs transition-colors"
        >
          {t("Rules")}
        </button>
        <button
          onClick={() => { playButtonClick(); setScreen("landing"); }}
          className="text-danger/50 hover:text-danger-light text-xs transition-colors"
        >
          {t("Leave")}
        </button>
      </div>
    </header>
  );
}
