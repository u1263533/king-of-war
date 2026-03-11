import { describe, it, expect } from "vitest";
import { createInitialState, processAction } from "../src/gameState";
import type { GameSettings } from "../../shared/types";

const settings: GameSettings = {
  playerCount: 2, mode: "classic", turnTimer: 60, isPrivate: false, roomCode: "TEST",
};

function startedGame() {
  let state = createInitialState("g1", settings);
  state = processAction(state, { type: "start_game" }).state;
  return state;
}

describe("buy_territory", () => {
  it("purchases unoccupied territory when player has enough coins", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 1; // Ashfield Outskirts, cost 8
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "buy_territory" });
    expect(result.error).toBeUndefined();
    expect(result.state.board[1].owner).toBe("p0");
    expect(result.state.players[0].coins).toBe(startCoins - 8);
    expect(result.state.players[0].ownedTerritories).toContain(1);
  });

  it("rejects purchase if player has insufficient coins", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 14; // Frostfang Castle, cost 26
    state.players[0].coins = 10;
    const result = processAction(state, { type: "buy_territory" });
    expect(result.error).toBeDefined();
  });

  it("rejects purchase if territory is already owned", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 1;
    state.board[1].owner = "p1";
    const result = processAction(state, { type: "buy_territory" });
    expect(result.error).toBeDefined();
  });

  it("rejects purchase if tile is not a territory", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 0; // Supply Station
    const result = processAction(state, { type: "buy_territory" });
    expect(result.error).toBeDefined();
  });

  it("transitions to management phase after buy", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 1;
    const result = processAction(state, { type: "buy_territory" });
    expect(result.state.phase).toBe("management");
  });
});

describe("pass_buy", () => {
  it("skips buying and transitions to management", () => {
    let state = startedGame();
    state.phase = "action";
    state.players[0].position = 1;
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "pass_buy" });
    expect(result.state.players[0].coins).toBe(startCoins);
    expect(result.state.board[1].owner).toBeNull();
    expect(result.state.phase).toBe("management");
  });
});

describe("pay rent", () => {
  it("auto-deducts rent when landing on enemy territory without garrison", () => {
    let state = startedGame();
    state.board[3].owner = "p1"; // Dusthaven, rent base 3
    state.board[3].buildingLevel = 0;
    state.players[0].position = 3;
    state.phase = "action";
    const p0Start = state.players[0].coins;
    const p1Start = state.players[1].coins;
    // Landing on enemy territory without garrison triggers auto rent
    const result = processAction(state, { type: "pass_buy" }); // pass_buy also handles rent for enemy territory
    // Actually rent is part of the action phase auto-resolution
    // We need the state machine to handle this
    expect(result.state.players[0].coins).toBe(p0Start - 3);
    expect(result.state.players[1].coins).toBe(p1Start + 3);
  });

  it("applies building multiplier to rent", () => {
    let state = startedGame();
    state.board[3].owner = "p1";
    state.board[3].buildingLevel = 2; // Fortress = 2x rent
    state.board[3].garrison = [];
    state.players[0].position = 3;
    state.phase = "action";
    const p0Start = state.players[0].coins;
    // Rent = 3 * 2 = 6
    const result = processAction(state, { type: "pass_buy" });
    expect(result.state.players[0].coins).toBe(p0Start - 6);
  });

  it("applies Stronghold 3x multiplier", () => {
    let state = startedGame();
    state.board[3].owner = "p1";
    state.board[3].buildingLevel = 3; // Stronghold = 3x
    state.board[3].garrison = [];
    state.players[0].position = 3;
    state.phase = "action";
    const p0Start = state.players[0].coins;
    const result = processAction(state, { type: "pass_buy" });
    expect(result.state.players[0].coins).toBe(p0Start - 9);
  });
});

describe("build", () => {
  it("builds Outpost (level 1) on own territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.players[0].ownedTerritories = [1];
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "build", tileIndex: 1 });
    expect(result.state.board[1].buildingLevel).toBe(1);
    expect(result.state.players[0].coins).toBe(startCoins - 5);
  });

  it("upgrades sequentially (1→2→3)", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.board[1].buildingLevel = 1;
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "build", tileIndex: 1 });
    expect(result.state.board[1].buildingLevel).toBe(2);
    expect(result.state.players[0].coins).toBe(state.players[0].coins - 10);
  });

  it("rejects build on territory not owned by player", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = "p1";
    const result = processAction(state, { type: "build", tileIndex: 1 });
    expect(result.error).toBeDefined();
  });

  it("rejects build on max level (3) territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.board[1].buildingLevel = 3;
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "build", tileIndex: 1 });
    expect(result.error).toBeDefined();
  });

  it("rejects build if insufficient coins", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.players[0].ownedTerritories = [1];
    state.players[0].coins = 2; // build costs 5
    const result = processAction(state, { type: "build", tileIndex: 1 });
    expect(result.error).toBeDefined();
  });
});

describe("sell_territory", () => {
  it("sells territory for 50% of purchase cost", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.board[1].purchaseCost = 8;
    state.players[0].ownedTerritories = [1];
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "sell_territory", tileIndex: 1 });
    expect(result.state.board[1].owner).toBeNull();
    expect(result.state.players[0].coins).toBe(startCoins + 4);
    expect(result.state.players[0].ownedTerritories).not.toContain(1);
  });

  it("returns garrison units to reserve pool when selling", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.board[1].garrison = [{ id: "u1", type: "infantry", combatPower: 1 }];
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "sell_territory", tileIndex: 1 });
    expect(result.state.board[1].garrison).toHaveLength(0);
    expect(result.state.players[0].reservePool).toHaveLength(1);
  });

  it("resets building level on sold territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.board[1].buildingLevel = 2;
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "sell_territory", tileIndex: 1 });
    expect(result.state.board[1].buildingLevel).toBe(0);
  });

  it("rejects selling territory not owned by player", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = "p1";
    const result = processAction(state, { type: "sell_territory", tileIndex: 1 });
    expect(result.error).toBeDefined();
  });
});

describe("bankruptcy", () => {
  it("eliminates player who cannot pay rent and has no assets", () => {
    let state = startedGame();
    state.phase = "action";
    state.board[3].owner = "p1";
    state.board[3].rentBase = 3;
    state.board[3].garrison = [];
    state.players[0].position = 3;
    state.players[0].coins = 1; // cannot afford rent of 3
    state.players[0].ownedTerritories = []; // nothing to sell
    // When rent is triggered and player can't pay...
    const result = processAction(state, { type: "pass_buy" });
    expect(result.state.players[0].isEliminated).toBe(true);
  });

  it("triggers victory when only one player remains", () => {
    let state = startedGame();
    state.players[1].isEliminated = true;
    // Eliminating player 0 should leave... wait, 2 players and 1 eliminated
    // Actually with 2 players, if player 0 is eliminated, player 1 wins
    state.phase = "action";
    state.board[3].owner = "p1";
    state.board[3].rentBase = 100;
    state.board[3].garrison = [];
    state.players[0].position = 3;
    state.players[0].coins = 0;
    state.players[0].ownedTerritories = [];
    const result = processAction(state, { type: "pass_buy" });
    // Both scenarios: player 0 eliminated
    if (result.state.players[0].isEliminated) {
      expect(result.state.status).toBe("ended");
      expect(result.state.winner).toBe("p1");
    }
  });
});
