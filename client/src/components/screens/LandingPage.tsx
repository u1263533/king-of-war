import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { t } from "../../utils/i18n";
import { playButtonClick } from "../../utils/sounds";
import { AVATAR_OPTIONS, setPlayerAvatar } from "../../utils/assetMap";

export function LandingPage() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startGame = useGameStore((s) => s.startGame);
  const [showSetup, setShowSetup] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState<"classic" | "blitz">("classic");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [setupStep, setSetupStep] = useState<"settings" | "avatar">("settings");

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-army-dark">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px),
                           repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)`,
        }} />
      </div>

      {/* Atmospheric glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
           style={{ background: "radial-gradient(circle, #d4a847 0%, transparent 70%)" }} />

      {/* Content */}
      <div className="relative z-10 text-center animate-fade-in">
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gold/40" />
          <div className="text-gold/60 text-sm tracking-[0.3em] uppercase font-body">{t("Strategic Rulebook")}</div>
          <div className="h-px w-16 bg-gold/40" />
        </div>

        {/* Title with glow animation */}
        <h1 className="font-stencil text-7xl md:text-9xl text-gold tracking-wider mb-4 drop-shadow-lg leading-none animate-glow-pulse animate-float">
          {t("THE KING OF WAR")}
        </h1>

        {/* Tagline */}
        <p className="text-khaki text-lg md:text-xl tracking-wide mb-12 font-body">
          {t("Build Your Empire. Command Your Army.")}
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => { playButtonClick(); setShowSetup(true); }}
            className="px-12 py-4 bg-gold text-army-dark font-stencil text-2xl tracking-wider
                       rounded hover:bg-khaki transition-all duration-200 animate-pulse-glow
                       active:scale-95"
          >
            {t("PLAY NOW")}
          </button>

          <button
            onClick={() => { playButtonClick(); setScreen("lobby"); }}
            className="px-8 py-3 border-2 border-gold/40 text-gold font-stencil text-lg tracking-wider
                       rounded hover:border-gold hover:bg-gold/10 transition-all duration-200"
          >
            {t("MULTIPLAYER LOBBY")}
          </button>

          <button
            className="mt-2 text-khaki/60 hover:text-khaki text-sm tracking-wide transition-colors"
            onClick={() => { playButtonClick(); useGameStore.getState().toggleHowToPlay(); }}
          >
            {t("How to Play")} &rarr;
          </button>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-army-lighter text-xs tracking-widest uppercase">
        <span>{t("Strategy")}</span>
        <span className="text-gold">&#9670;</span>
        <span>{t("Combat")}</span>
        <span className="text-gold">&#9670;</span>
        <span>{t("Domination")}</span>
      </div>

      <div className="absolute bottom-3 right-4 text-army-lighter/40 text-xs">v0.1.0 MVP</div>

      {/* Game Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={() => { setShowSetup(false); setSetupStep("settings"); }}>
          <div className="bg-army-dark border-2 border-gold/30 rounded-xl p-6 shadow-2xl animate-bounce-in"
               style={{ width: setupStep === "avatar" ? "640px" : "384px" }}
               onClick={(e) => e.stopPropagation()}>

            {setupStep === "settings" && (
              <>
                <h2 className="font-stencil text-2xl text-gold tracking-wider mb-6 text-center">{t("NEW GAME")}</h2>

                {/* Mode */}
                <div className="mb-4">
                  <label className="text-xs text-khaki/50 tracking-wider block mb-2">{t("GAME MODE")}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { playButtonClick(); setMode("classic"); }}
                      className={`flex-1 py-2 font-stencil text-sm tracking-wider rounded transition-all ${
                        mode === "classic" ? "bg-gold text-army-dark" : "border border-army-light/40 text-khaki/60 hover:border-gold/40"
                      }`}
                    >
                      {t("CLASSIC (20 tiles)")}
                    </button>
                    <button
                      onClick={() => { playButtonClick(); setMode("blitz"); if (playerCount > 3) setPlayerCount(3); }}
                      className={`flex-1 py-2 font-stencil text-sm tracking-wider rounded transition-all ${
                        mode === "blitz" ? "bg-gold text-army-dark" : "border border-army-light/40 text-khaki/60 hover:border-gold/40"
                      }`}
                    >
                      {t("BLITZ (10 tiles)")}
                    </button>
                  </div>
                </div>

                {/* Player count */}
                <div className="mb-6">
                  <label className="text-xs text-khaki/50 tracking-wider block mb-2">{t("OPPONENTS (AI)")}</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].filter(n => mode === "blitz" ? n <= 3 : true).map((n) => (
                      <button
                        key={n}
                        onClick={() => { playButtonClick(); setPlayerCount(n); }}
                        className={`flex-1 py-2 font-stencil text-sm rounded transition-all ${
                          playerCount === n ? "bg-gold text-army-dark" : "border border-army-light/40 text-khaki/60 hover:border-gold/40"
                        }`}
                      >
                        {n - 1} AI
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next: choose avatar */}
                <button
                  onClick={() => { playButtonClick(); setSetupStep("avatar"); }}
                  className="w-full py-3 bg-gold text-army-dark font-stencil text-xl tracking-wider rounded
                             hover:bg-khaki transition-all active:scale-95"
                >
                  选择角色 &rarr;
                </button>
                <button
                  onClick={() => { playButtonClick(); setShowSetup(false); setSetupStep("settings"); }}
                  className="w-full mt-2 py-2 text-khaki/40 text-xs hover:text-khaki transition-colors"
                >
                  {t("Cancel")}
                </button>
              </>
            )}

            {setupStep === "avatar" && (
              <>
                <h2 className="font-stencil text-2xl text-gold tracking-wider mb-2 text-center">选择你的指挥官</h2>
                <p className="text-xs text-khaki/40 text-center mb-4">选择一位角色作为你的战场化身</p>

                {/* Avatar grid */}
                <div className="grid grid-cols-4 gap-3 mb-6 max-h-[400px] overflow-y-auto pr-1">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => { playButtonClick(); setSelectedAvatar(avatar.id); }}
                      className={`relative flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 group ${
                        selectedAvatar === avatar.id
                          ? "border-gold bg-gold/10 shadow-lg shadow-gold/20 scale-105"
                          : "border-army-light/30 hover:border-gold/50 hover:bg-army-light/10"
                      }`}
                    >
                      <div className={`w-24 h-24 rounded-full overflow-hidden border-2 mb-2 transition-all ${
                        selectedAvatar === avatar.id ? "border-gold" : "border-army-light/40 group-hover:border-khaki/60"
                      }`}>
                        <img src={avatar.path} alt={avatar.name} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-xs font-stencil tracking-wide transition-colors ${
                        selectedAvatar === avatar.id ? "text-gold" : "text-khaki/60 group-hover:text-cream"
                      }`}>
                        {avatar.name}
                      </span>
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center text-army-dark text-xs font-bold">
                          &#10003;
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Bottom buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { playButtonClick(); setSetupStep("settings"); }}
                    className="flex-1 py-3 border border-army-light/40 text-khaki/60 font-stencil text-sm tracking-wider rounded
                               hover:border-gold/40 hover:text-khaki transition-all"
                  >
                    &larr; 返回
                  </button>
                  <button
                    onClick={() => {
                      playButtonClick();
                      setPlayerAvatar(selectedAvatar);
                      startGame(playerCount, mode);
                      setShowSetup(false);
                      setSetupStep("settings");
                    }}
                    className="flex-2 px-8 py-3 bg-gold text-army-dark font-stencil text-xl tracking-wider rounded
                               hover:bg-khaki transition-all active:scale-95"
                  >
                    {t("START BATTLE")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
