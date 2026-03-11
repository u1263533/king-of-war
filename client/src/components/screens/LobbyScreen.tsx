import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import type { GameMode } from "../../types/game";

export function LobbyScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const startGame = useGameStore((s) => s.startGame);
  const [tab, setTab] = useState<"create" | "join">("create");
  const [mode, setMode] = useState<GameMode>("classic");
  const [playerCount, setPlayerCount] = useState(3);
  const [timer, setTimer] = useState(60);
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="h-screen w-screen flex flex-col bg-army-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-army-light/30">
        <button onClick={() => setScreen("landing")} className="text-khaki hover:text-gold transition-colors text-sm">
          ← Back
        </button>
        <h1 className="font-stencil text-2xl text-gold tracking-wider">WAR ROOM</h1>
        <div className="w-16" />
      </header>

      <div className="flex-1 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-lg">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-army-light/30">
            <button
              onClick={() => setTab("create")}
              className={`flex-1 py-3 text-center font-stencil tracking-wider transition-all ${
                tab === "create" ? "text-gold border-b-2 border-gold" : "text-khaki/50 hover:text-khaki"
              }`}
            >
              CREATE ROOM
            </button>
            <button
              onClick={() => setTab("join")}
              className={`flex-1 py-3 text-center font-stencil tracking-wider transition-all ${
                tab === "join" ? "text-gold border-b-2 border-gold" : "text-khaki/50 hover:text-khaki"
              }`}
            >
              JOIN ROOM
            </button>
          </div>

          {tab === "create" ? (
            <div className="animate-fade-in space-y-5">
              {/* Game Mode */}
              <div>
                <label className="text-khaki text-sm tracking-wide block mb-2">GAME MODE</label>
                <div className="flex gap-3">
                  {(["classic", "blitz"] as GameMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-3 rounded border-2 font-stencil tracking-wider transition-all ${
                        mode === m
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-army-light text-khaki/50 hover:border-khaki/40"
                      }`}
                    >
                      {m === "classic" ? "CLASSIC" : "BLITZ"}
                      <div className="text-xs font-body mt-1 font-normal">
                        {m === "classic" ? "20 tiles · 45-60 min" : "10 tiles · 20-25 min"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Count */}
              <div>
                <label className="text-khaki text-sm tracking-wide block mb-2">PLAYERS</label>
                <div className="flex gap-3">
                  {(mode === "blitz" ? [2, 3] : [2, 3, 4]).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPlayerCount(n)}
                      className={`flex-1 py-3 rounded border-2 font-stencil text-lg transition-all ${
                        playerCount === n
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-army-light text-khaki/50 hover:border-khaki/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turn Timer */}
              <div>
                <label className="text-khaki text-sm tracking-wide block mb-2">TURN TIMER</label>
                <div className="flex gap-3">
                  {[30, 60, 90, 0].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimer(t)}
                      className={`flex-1 py-3 rounded border-2 text-sm font-body transition-all ${
                        timer === t
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-army-light text-khaki/50 hover:border-khaki/40"
                      }`}
                    >
                      {t === 0 ? "None" : `${t}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={() => startGame(playerCount, mode)}
                className="w-full py-4 bg-gold text-army-dark font-stencil text-xl tracking-wider
                           rounded hover:bg-khaki transition-all active:scale-[0.98]"
              >
                DEPLOY ROOM
              </button>
            </div>
          ) : (
            <div className="animate-fade-in space-y-5">
              {/* Room Code Input */}
              <div>
                <label className="text-khaki text-sm tracking-wide block mb-2">ROOM CODE</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code..."
                  maxLength={6}
                  className="w-full px-4 py-3 bg-army border-2 border-army-light rounded
                             text-cream text-center font-stencil text-2xl tracking-[0.5em]
                             placeholder:text-army-lighter placeholder:text-base placeholder:tracking-normal
                             focus:border-gold focus:outline-none transition-colors"
                />
              </div>

              <button
                disabled={roomCode.length < 4}
                className="w-full py-4 bg-gold text-army-dark font-stencil text-xl tracking-wider
                           rounded hover:bg-khaki transition-all active:scale-[0.98]
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                JOIN BATTLE
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-army-light/30" />
                <span className="text-army-lighter text-xs tracking-wider">OR FIND A ROOM</span>
                <div className="flex-1 h-px bg-army-light/30" />
              </div>

              {/* Public Rooms List */}
              <div className="space-y-2">
                {[
                  { code: "ALPHA", mode: "Classic", players: "2/4", host: "General Steel" },
                  { code: "BRAVO", mode: "Blitz", players: "1/3", host: "Player_42" },
                ].map((room) => (
                  <div
                    key={room.code}
                    className="flex items-center justify-between p-3 rounded border border-army-light/30
                               hover:border-khaki/40 hover:bg-army/50 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="text-cream font-stencil tracking-wider">{room.code}</div>
                      <div className="text-khaki/50 text-xs">{room.host} · {room.mode}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-khaki text-sm">{room.players}</span>
                      <button className="px-3 py-1 border border-gold text-gold text-sm rounded hover:bg-gold/10 transition-all">
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
