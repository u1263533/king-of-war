import { describe, it, expect } from "vitest";
import { createInitialState, processAction } from "../src/gameState";
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

describe("recruit", () => {
  it("recruits infantry into reserve pool", () => {
    let state = startedGame();
    state.phase = "management";
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "recruit", unitType: "infantry", count: 2 });
    expect(result.state.players[0].reservePool).toHaveLength(2);
    expect(result.state.players[0].reservePool[0].type).toBe("infantry");
    expect(result.state.players[0].reservePool[0].combatPower).toBe(1);
    expect(result.state.players[0].coins).toBe(startCoins - 6); // 3 * 2
  });

  it("recruits tanks into reserve pool", () => {
    let state = startedGame();
    state.phase = "management";
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "recruit", unitType: "tank", count: 1 });
    expect(result.state.players[0].reservePool).toHaveLength(1);
    expect(result.state.players[0].reservePool[0].type).toBe("tank");
    expect(result.state.players[0].reservePool[0].combatPower).toBe(3);
    expect(result.state.players[0].coins).toBe(startCoins - 8);
  });

  it("recruits aircraft into reserve pool", () => {
    let state = startedGame();
    state.phase = "management";
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "recruit", unitType: "aircraft", count: 1 });
    expect(result.state.players[0].reservePool).toHaveLength(1);
    expect(result.state.players[0].reservePool[0].combatPower).toBe(5);
    expect(result.state.players[0].coins).toBe(startCoins - 12);
  });

  it("rejects recruit if insufficient coins", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].coins = 5;
    const result = processAction(state, { type: "recruit", unitType: "tank", count: 1 });
    expect(result.error).toBeDefined();
  });

  it("rejects recruit of zero or negative count", () => {
    let state = startedGame();
    state.phase = "management";
    const result = processAction(state, { type: "recruit", unitType: "infantry", count: 0 });
    expect(result.error).toBeDefined();
  });
});

describe("deploy_mobile", () => {
  it("moves units from reserve to mobile army", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].reservePool = [mkUnit("infantry", "u1"), mkUnit("tank", "u2")];
    const result = processAction(state, { type: "deploy_mobile", unitIds: ["u1"] });
    expect(result.state.players[0].mobileArmy).toHaveLength(1);
    expect(result.state.players[0].mobileArmy[0].id).toBe("u1");
    expect(result.state.players[0].reservePool).toHaveLength(1);
  });

  it("rejects deploying units not in reserve pool", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].reservePool = [mkUnit("infantry", "u1")];
    const result = processAction(state, { type: "deploy_mobile", unitIds: ["u99"] });
    expect(result.error).toBeDefined();
  });
});

describe("deploy_garrison", () => {
  it("deploys units from reserve to garrison on owned territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.board[1].owner = state.players[0].id;
    state.players[0].ownedTerritories = [1];
    state.players[0].reservePool = [mkUnit("tank", "u1")];
    const result = processAction(state, { type: "deploy_garrison", unitIds: ["u1"], tileIndex: 1 });
    expect(result.state.board[1].garrison).toHaveLength(1);
    expect(result.state.board[1].garrison[0].id).toBe("u1");
    expect(result.state.players[0].reservePool).toHaveLength(0);
  });

  it("rejects garrison on unowned territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].reservePool = [mkUnit("infantry", "u1")];
    const result = processAction(state, { type: "deploy_garrison", unitIds: ["u1"], tileIndex: 1 });
    expect(result.error).toBeDefined();
  });
});

describe("transfer_to_garrison", () => {
  it("transfers mobile army units to garrison at current position", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].position = 1;
    state.board[1].owner = state.players[0].id;
    state.players[0].ownedTerritories = [1];
    state.players[0].mobileArmy = [mkUnit("infantry", "u1"), mkUnit("tank", "u2")];
    const result = processAction(state, { type: "transfer_to_garrison", unitIds: ["u1"] });
    expect(result.state.players[0].mobileArmy).toHaveLength(1);
    expect(result.state.board[1].garrison).toHaveLength(1);
  });

  it("rejects transfer if not on own territory", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].position = 1; // unowned tile
    state.players[0].mobileArmy = [mkUnit("infantry", "u1")];
    const result = processAction(state, { type: "transfer_to_garrison", unitIds: ["u1"] });
    expect(result.error).toBeDefined();
  });
});

describe("transfer_to_mobile", () => {
  it("transfers garrison units to mobile army at current position", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].position = 1;
    state.board[1].owner = state.players[0].id;
    state.board[1].garrison = [mkUnit("tank", "u1")];
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "transfer_to_mobile", unitIds: ["u1"] });
    expect(result.state.players[0].mobileArmy).toHaveLength(1);
    expect(result.state.board[1].garrison).toHaveLength(0);
  });
});
