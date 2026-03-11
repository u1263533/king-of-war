import { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { PLAYER_COLORS } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { playVictory, playDefeat, playButtonClick } from "../../utils/sounds";

export function VictoryScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const [soundPlayed, setSoundPlayed] = useState(false);

  const winner = gameState?.players.find((p) => p.id === gameState.winner) || gameState?.players[0];
  const isMe = winner?.id === myPlayerId;

  useEffect(() => {
    if (!soundPlayed && winner) {
      if (isMe) playVictory();
      else playDefeat();
      setSoundPlayed(true);
    }
  }, [soundPlayed, winner, isMe]);

  if (!gameState || !winner) return null;

  const stats = [
    { label: t("Battles Won"), value: winner.stats.battlesWon },
    { label: t("Territories"), value: winner.ownedTerritories.length },
    { label: t("Coins"), value: winner.stats.coinsEarned },
    { label: t("Units Recruited"), value: winner.stats.unitsRecruited },
    { label: t("Turns Played"), value: gameState.turnNumber },
    { label: t("Captured"), value: winner.stats.territoriesCaptured },
  ];

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-army-dark relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${PLAYER_COLORS[winner.color]} 0%, transparent 60%)` }}
      />

      <div className="relative z-10 text-center animate-slide-up">
        {/* Crown */}
        <div className="text-6xl mb-4 animate-float">&#9813;</div>

        <h1 className="font-stencil text-5xl md:text-7xl text-gold tracking-wider mb-2 animate-victory-glow">
          {isMe ? t("VICTORY") : t("DEFEAT")}
        </h1>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-4 h-4 rounded-full" style={{ background: PLAYER_COLORS[winner.color] }} />
          <p className="text-2xl text-cream font-stencil tracking-wider">{winner.name}</p>
        </div>

        <p className="text-khaki text-lg mb-10">
          {isMe ? t("You are the King of War!") : `${winner.name} ${t("has conquered all!")}`}
        </p>

        {/* Stats with counter animation */}
        <div className="grid grid-cols-3 gap-6 mb-10 max-w-md mx-auto">
          {stats.map(({ label, value }, idx) => (
            <div key={label} className="text-center animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="text-2xl font-stencil text-gold animate-coin-fly" style={{ animationDelay: `${idx * 0.15}s` }}>{value}</div>
              <div className="text-xs text-khaki/60 tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* All Players Ranking */}
        <div className="mb-10 space-y-2 max-w-sm mx-auto">
          {gameState.players
            .sort((a, b) => (a.isEliminated ? 1 : 0) - (b.isEliminated ? 1 : 0))
            .map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-2 rounded animate-slide-in-left ${
                  p.id === winner.id ? "bg-gold/15 border border-gold/30" : "bg-army/50"
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-khaki/40 text-sm w-5">#{i + 1}</span>
                  <div className="w-3 h-3 rounded-full" style={{ background: PLAYER_COLORS[p.color] }} />
                  <span className={p.isEliminated ? "text-khaki/40 line-through" : "text-cream"}>{p.name}</span>
                </div>
                <span className="text-khaki text-sm">{p.coins} {t("Coins").toLowerCase()}</span>
              </div>
            ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => { playButtonClick(); setScreen("landing"); }}
            className="px-8 py-3 bg-gold text-army-dark font-stencil text-lg tracking-wider rounded
                       hover:bg-khaki transition-all active:scale-95"
          >
            {t("PLAY AGAIN")}
          </button>
          <button
            onClick={() => { playButtonClick(); setScreen("landing"); }}
            className="px-8 py-3 border-2 border-gold/40 text-gold font-stencil text-lg tracking-wider rounded
                       hover:border-gold transition-all"
          >
            {t("MAIN MENU")}
          </button>
        </div>
      </div>
    </div>
  );
}
