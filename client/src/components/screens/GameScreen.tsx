import { useGameStore, type GameToast } from "../../stores/gameStore";
import { GameBoard } from "../board/GameBoard";
import { PlayerPanelSidebar } from "../hud/PlayerPanelSidebar";
import { TileDetailPanel } from "../hud/TileDetailPanel";
import { GameHeader } from "../hud/GameHeader";
import { BottomBar } from "../hud/BottomBar";
import { CombatOverlay } from "../combat/CombatOverlay";
import { HowToPlayPanel } from "../modals/HowToPlayPanel";

function ToastItem({ toast }: { toast: GameToast }) {
  const bgColor = toast.type === "combat" ? "bg-danger/90 border-danger-light" :
                  toast.type === "retreat" ? "bg-army-light/90 border-khaki/40" :
                  "bg-gold/90 border-gold";
  const icon = toast.type === "combat" ? "\u2694\uFE0F" : toast.type === "retreat" ? "\uD83D\uDEA9" : "\u2139\uFE0F";
  return (
    <div className={`${bgColor} border rounded-lg px-4 py-2 shadow-lg animate-slide-down flex items-center gap-2`}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-cream font-stencil tracking-wide">{toast.message}</span>
    </div>
  );
}

export function GameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const showHowToPlay = useGameStore((s) => s.showHowToPlay);
  const showCombat = useGameStore((s) => s.showCombat);
  const toasts = useGameStore((s) => s.toasts);

  if (!gameState) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-army-dark overflow-hidden">
      <GameHeader />

      <div className="flex-1 flex min-h-0">
        <PlayerPanelSidebar />
        <GameBoard />
        <TileDetailPanel />
      </div>

      <BottomBar />

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
        </div>
      )}

      {showCombat && <CombatOverlay />}
      {showHowToPlay && <HowToPlayPanel />}
    </div>
  );
}
