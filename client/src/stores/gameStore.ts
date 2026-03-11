import { create } from "zustand";
import type { ChatMessage, GameState, Screen } from "../types/game";
import { createGame, toClientState, dispatch, runAITurn, type ServerState, type ActionResult } from "../engine/localEngine";

export interface GameToast {
  id: number;
  message: string;
  type: "combat" | "retreat" | "info";
}

interface GameStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  serverState: ServerState | null;
  myPlayerId: string;
  selectedTile: number | null;
  selectTile: (index: number | null) => void;
  showHowToPlay: boolean;
  toggleHowToPlay: () => void;
  showCombat: boolean;
  setShowCombat: (show: boolean) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  phaseTimer: number;
  setPhaseTimer: (t: number) => void;
  gameLog: string[];
  toasts: GameToast[];
  addToast: (message: string, type: GameToast["type"]) => void;
  removeToast: (id: number) => void;

  // Game actions
  startGame: (playerCount: number, mode: "classic" | "blitz") => void;
  doAction: (action: string, payload?: Record<string, unknown>) => ActionResult | undefined;
  endCombat: () => void;
}

function syncClientState(serverState: ServerState, playerId: string): GameState {
  return toClientState(serverState, playerId);
}

function scheduleAITurns(set: (fn: (s: GameStore) => Partial<GameStore>) => void, get: () => GameStore) {
  const check = () => {
    const { serverState, myPlayerId } = get();
    if (!serverState || serverState.status === "ended") return;

    // If combat is active (e.g. AI just initiated it), show the overlay and pause AI
    if (serverState.combatState) {
      const gs = syncClientState(serverState, myPlayerId);
      set(() => ({ gameState: gs, showCombat: true, gameLog: [...serverState.log] }));
      return; // Pause — endCombat will resume AI turns
    }

    const current = serverState.players[serverState.currentPlayerIndex];
    if (current.isAI && !current.isEliminated) {
      setTimeout(() => {
        const { serverState: ss } = get();
        if (!ss || ss.status === "ended") return;
        const cp = ss.players[ss.currentPlayerIndex];
        if (!cp.isAI || cp.isEliminated) return;

        const logBefore = ss.log.length;
        runAITurn(ss);
        const gs = syncClientState(ss, myPlayerId);

        // Check new log entries for retreat/combat notifications
        const newLogs = ss.log.slice(logBefore);
        for (const msg of newLogs) {
          if (msg.includes("撤退") || msg.includes("高额通行费")) {
            get().addToast(msg, "retreat");
          }
        }

        set(() => ({
          gameState: gs,
          gameLog: [...ss.log],
        }));

        // If AI initiated combat, show overlay and pause
        if (ss.combatState) {
          const aiName = cp.name;
          const combatTile = ss.board[ss.combatState.tileIndex];
          get().addToast(`${aiName} 向 ${combatTile?.name ?? ""} 发起进攻！`, "combat");
          set(() => ({ showCombat: true }));
          return; // Pause — endCombat will resume
        }

        if ((ss.status as string) === "ended") {
          setTimeout(() => {
            set(() => ({ screen: "victory" }));
          }, 1500);
          return;
        }

        scheduleAITurns(set, get);
      }, 800 + Math.random() * 600);
    }
  };
  check();
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "landing",
  setScreen: (screen) => set({ screen }),
  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  serverState: null,
  myPlayerId: "p0",
  selectedTile: null,
  selectTile: (selectedTile) => set({ selectedTile }),
  showHowToPlay: false,
  toggleHowToPlay: () => set((s) => ({ showHowToPlay: !s.showHowToPlay })),
  showCombat: false,
  setShowCombat: (showCombat) => set({ showCombat }),
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  phaseTimer: 60,
  setPhaseTimer: (phaseTimer) => set({ phaseTimer }),
  gameLog: [],
  toasts: [],
  addToast: (message, type) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  startGame: (playerCount, mode) => {
    const settings = { playerCount, mode, turnTimer: 60, isPrivate: false, roomCode: "LOCAL" };
    const ss = createGame(settings);
    const gs = syncClientState(ss, "p0");
    set({
      serverState: ss,
      gameState: gs,
      screen: "game",
      myPlayerId: "p0",
      gameLog: [...ss.log],
      chatMessages: [],
      selectedTile: null,
    });
  },

  doAction: (action, payload) => {
    const { serverState, myPlayerId, addToast } = get();
    if (!serverState) return undefined;
    const result = dispatch(serverState, action, payload);
    if (result.error) return result;

    const gs = syncClientState(serverState, myPlayerId);
    set({
      gameState: gs,
      gameLog: [...serverState.log],
    });

    // Toast notifications for combat and retreat
    if (action === "combat_choice") {
      const choice = payload?.choice as string;
      const tile = serverState.board[serverState.players[serverState.currentPlayerIndex]?.position];
      const tileName = tile ? tile.name : "";
      if (choice === "military") {
        addToast(`向 ${tileName} 发起进攻！`, "combat");
      } else if (choice === "retreat") {
        addToast(`从 ${tileName} 撤退并支付租金`, "retreat");
      } else if (choice === "costly") {
        addToast(`支付高额通行费通过 ${tileName}`, "retreat");
      }
    }

    // Check victory
    if (serverState.status === "ended") {
      setTimeout(() => {
        set({ screen: "victory" });
      }, 1500);
      return result;
    }

    // Check if it's AI's turn
    scheduleAITurns(set, get);

    return result;
  },

  endCombat: () => {
    const { serverState, myPlayerId } = get();
    if (!serverState) return;
    serverState.combatState = null;
    serverState.phase = "management";
    const gs = syncClientState(serverState, myPlayerId);
    set({
      gameState: gs,
      showCombat: false,
      gameLog: [...serverState.log],
    });

    scheduleAITurns(set, get);
  },
}));
