import { describe, it, expect } from "vitest";
import { createInitialState, processAction, getNextPhase } from "../src/gameState";
import type { GameState, GameSettings } from "../../shared/types";

const defaultSettings: GameSettings = {
  playerCount: 3,
  mode: "classic",
  turnTimer: 60,
  isPrivate: false,
  roomCode: "TEST",
};

describe("createInitialState", () => {
  it("creates a game with correct number of players", () => {
    const state = createInitialState("game-1", defaultSettings);
    expect(state.players).toHaveLength(3);
  });

  it("sets all players at position 0 (Supply Station)", () => {
    const state = createInitialState("game-1", defaultSettings);
    state.players.forEach((p) => {
      expect(p.position).toBe(0);
    });
  });

  it("gives correct starting coins based on player count", () => {
    const state3 = createInitialState("g1", { ...defaultSettings, playerCount: 3 });
    state3.players.forEach((p) => expect(p.coins).toBe(50));

    const state2 = createInitialState("g2", { ...defaultSettings, playerCount: 2 });
    state2.players.forEach((p) => expect(p.coins).toBe(60));

    const state4 = createInitialState("g3", { ...defaultSettings, playerCount: 4 });
    state4.players.forEach((p) => expect(p.coins).toBe(40));
  });

  it("assigns distinct colors to each player", () => {
    const state = createInitialState("game-1", defaultSettings);
    const colors = state.players.map((p) => p.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("creates a shuffled card deck with 30 cards", () => {
    const state = createInitialState("game-1", defaultSettings);
    expect(state.cardDeck).toHaveLength(30);
  });

  it("starts in waiting status with movement phase", () => {
    const state = createInitialState("game-1", defaultSettings);
    expect(state.status).toBe("waiting");
    expect(state.phase).toBe("movement");
  });

  it("uses classic board (20 tiles) for classic mode", () => {
    const state = createInitialState("game-1", defaultSettings);
    expect(state.board).toHaveLength(20);
  });

  it("uses blitz board (10 tiles) for blitz mode", () => {
    const state = createInitialState("game-1", { ...defaultSettings, mode: "blitz", playerCount: 2 });
    expect(state.board).toHaveLength(10);
  });

  it("gives blitz mode higher starting coins", () => {
    const state = createInitialState("game-1", { ...defaultSettings, mode: "blitz", playerCount: 2 });
    state.players.forEach((p) => expect(p.coins).toBe(80));
  });

  it("starts with empty hands, reserve pools, and mobile armies", () => {
    const state = createInitialState("game-1", defaultSettings);
    state.players.forEach((p) => {
      expect(p.hand).toHaveLength(0);
      expect(p.reservePool).toHaveLength(0);
      expect(p.mobileArmy).toHaveLength(0);
    });
  });

  it("has no territories owned at start", () => {
    const state = createInitialState("game-1", defaultSettings);
    state.board.forEach((t) => expect(t.owner).toBeNull());
    state.players.forEach((p) => expect(p.ownedTerritories).toHaveLength(0));
  });
});

describe("processAction - start_game", () => {
  it("transitions from waiting to playing", () => {
    const state = createInitialState("game-1", defaultSettings);
    const result = processAction(state, { type: "start_game" });
    expect(result.state.status).toBe("playing");
    expect(result.state.phase).toBe("movement");
    expect(result.state.turnNumber).toBe(1);
  });

  it("fails if game is already playing", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    const result = processAction(state, { type: "start_game" });
    expect(result.error).toBeDefined();
  });
});

describe("processAction - roll_dice", () => {
  it("sets lastDiceRoll with two values between 1-6", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    const result = processAction(state, { type: "roll_dice" });
    expect(result.state.lastDiceRoll).toHaveLength(2);
    result.state.lastDiceRoll!.forEach((d) => {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    });
  });

  it("moves the current player's position by dice total", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    const result = processAction(state, { type: "roll_dice" });
    const diceTotal = result.state.lastDiceRoll![0] + result.state.lastDiceRoll![1];
    expect(result.state.players[0].position).toBe(diceTotal % 20);
  });

  it("wraps position around the board", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.players[0].position = 18; // near end of board
    const result = processAction(state, { type: "roll_dice" });
    const diceTotal = result.state.lastDiceRoll![0] + result.state.lastDiceRoll![1];
    expect(result.state.players[0].position).toBe((18 + diceTotal) % 20);
  });

  it("sets doublesRolled flag when dice match", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    // We can't control dice, but we test the flag logic exists
    const result = processAction(state, { type: "roll_dice" });
    const [d1, d2] = result.state.lastDiceRoll!;
    expect(result.state.doublesRolled).toBe(d1 === d2);
  });

  it("transitions to action phase after rolling", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    const result = processAction(state, { type: "roll_dice" });
    expect(result.state.phase).toBe("action");
  });

  it("rejects roll_dice when not in movement phase", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.phase = "action";
    const result = processAction(state, { type: "roll_dice" });
    expect(result.error).toBeDefined();
  });

  it("grants supply income when passing Supply Station", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.players[0].position = 17; // near end, high dice will pass position 0
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "roll_dice" });
    const newPos = result.state.players[0].position;
    if (newPos < 17) {
      // Wrapped around — should have received supply income
      expect(result.state.players[0].coins).toBe(startCoins + 10);
    }
  });
});

describe("processAction - phase transitions", () => {
  it("end_management advances to next player", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.phase = "management";
    state.currentPlayerIndex = 0;
    const result = processAction(state, { type: "end_management" });
    expect(result.state.currentPlayerIndex).toBe(1);
    expect(result.state.phase).toBe("movement");
  });

  it("end_management wraps to player 0 after last player", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.phase = "management";
    state.currentPlayerIndex = 2; // last player (3 players)
    const result = processAction(state, { type: "end_management" });
    expect(result.state.currentPlayerIndex).toBe(0);
    expect(result.state.turnNumber).toBe(2);
  });

  it("skips eliminated players on turn advance", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.phase = "management";
    state.currentPlayerIndex = 0;
    state.players[1].isEliminated = true;
    const result = processAction(state, { type: "end_management" });
    expect(result.state.currentPlayerIndex).toBe(2); // skipped player 1
  });

  it("doubles give extra turn (same player)", () => {
    let state = createInitialState("game-1", defaultSettings);
    state = processAction(state, { type: "start_game" }).state;
    state.phase = "management";
    state.currentPlayerIndex = 0;
    state.doublesRolled = true;
    const result = processAction(state, { type: "end_management" });
    expect(result.state.currentPlayerIndex).toBe(0); // same player
    expect(result.state.doublesRolled).toBe(false); // flag reset
  });
});
