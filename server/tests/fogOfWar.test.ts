import { describe, it, expect } from "vitest";
import { createInitialState, processAction, createPlayerView } from "../src/gameState";
import type { GameSettings, Unit } from "../../shared/types";

const settings: GameSettings = {
  playerCount: 2, mode: "classic", turnTimer: 60, isPrivate: false, roomCode: "TEST",
};

function startedGame() {
  let state = createInitialState("g1", settings);
  state = processAction(state, { type: "start_game" }).state;
  return state;
}

const mkUnit = (type: Unit["type"], id: string): Unit => ({
  id, type, combatPower: type === "infantry" ? 1 : type === "tank" ? 3 : 5,
});

describe("createPlayerView", () => {
  it("hides enemy garrison details", () => {
    let state = startedGame();
    state.board[3].owner = "p1";
    state.board[3].garrison = [mkUnit("tank", "g1"), mkUnit("infantry", "g2")];
    const view = createPlayerView(state, "p0");
    // Enemy garrison should be hidden (show count or "hidden")
    expect(view.board[3].garrison).not.toEqual(state.board[3].garrison);
  });

  it("shows own garrison details", () => {
    let state = startedGame();
    state.board[3].owner = "p0";
    state.board[3].garrison = [mkUnit("tank", "g1")];
    const view = createPlayerView(state, "p0");
    expect(view.board[3].garrison).toEqual(state.board[3].garrison);
  });

  it("reveals garrison after military_investigation", () => {
    let state = startedGame();
    state.board[3].owner = "p1";
    state.board[3].garrison = [mkUnit("tank", "g1")];
    state.players[0].revealedGarrisons = [3];
    const view = createPlayerView(state, "p0");
    // Should show garrison since player used investigation on it
    expect(view.board[3].garrison).toEqual(state.board[3].garrison);
  });

  it("hides other players' hand contents", () => {
    let state = startedGame();
    state.players[1].hand = [
      { id: "c1", type: "war_fund", timing: "instant", name: "War Fund", description: "" },
    ];
    const view = createPlayerView(state, "p0");
    // Other player's hand should show count, not contents
    expect(typeof view.players[1].handCount).toBe("number");
    expect(view.players[1].handCount).toBe(1);
  });

  it("shows own hand contents", () => {
    let state = startedGame();
    state.players[0].hand = [
      { id: "c1", type: "war_fund", timing: "instant", name: "War Fund", description: "" },
    ];
    const view = createPlayerView(state, "p0");
    expect(view.players[0].hand).toHaveLength(1);
    expect(view.players[0].hand[0].type).toBe("war_fund");
  });

  it("shows garrison count for hidden garrisons", () => {
    let state = startedGame();
    state.board[3].owner = "p1";
    state.board[3].garrison = [mkUnit("tank", "g1"), mkUnit("infantry", "g2")];
    const view = createPlayerView(state, "p0");
    // Should at least indicate there IS a garrison (count)
    expect(view.board[3].garrisonCount).toBe(2);
  });
});
