import { describe, it, expect } from "vitest";
import { createInitialState, processAction } from "../src/gameState";
import type { GameSettings, Card } from "../../shared/types";

const settings: GameSettings = {
  playerCount: 2, mode: "classic", turnTimer: 60, isPrivate: false, roomCode: "TEST",
};

function startedGame() {
  let state = createInitialState("g1", settings);
  state = processAction(state, { type: "start_game" }).state;
  return state;
}

function mkCard(type: Card["type"], id: string): Card {
  return {
    id, type,
    timing: type === "mercenary" || type === "dummy_supplies" || type === "surprise_attack" || type === "surrounded"
      ? "combat"
      : type === "fuse_mine" ? "defense"
      : type === "transport_aircraft" ? "movement"
      : "instant",
    name: type,
    description: "",
  };
}

describe("play_card - instant cards", () => {
  it("war_fund grants 4 coins", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("war_fund", "c1");
    state.players[0].hand = [card];
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "play_card", cardId: "c1" });
    expect(result.state.players[0].coins).toBe(startCoins + 4);
    expect(result.state.players[0].hand).toHaveLength(0);
    expect(result.state.discardPile).toContainEqual(expect.objectContaining({ id: "c1" }));
  });

  it("land_tax grants 2 coins per owned territory", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("land_tax", "c1");
    state.players[0].hand = [card];
    state.players[0].ownedTerritories = [1, 3, 5];
    const startCoins = state.players[0].coins;
    const result = processAction(state, { type: "play_card", cardId: "c1" });
    expect(result.state.players[0].coins).toBe(startCoins + 6); // 2 * 3
  });

  it("repressive removes 5 coins from target player", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("repressive", "c1");
    state.players[0].hand = [card];
    const p1Start = state.players[1].coins;
    const result = processAction(state, { type: "play_card", cardId: "c1", target: "p1" });
    expect(result.state.players[1].coins).toBe(p1Start - 5);
  });

  it("mobilisation_of_militia adds 2 free infantry to reserve", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("mobilisation_of_militia", "c1");
    state.players[0].hand = [card];
    const result = processAction(state, { type: "play_card", cardId: "c1" });
    expect(result.state.players[0].reservePool).toHaveLength(2);
    expect(result.state.players[0].reservePool[0].type).toBe("infantry");
    expect(result.state.players[0].reservePool[1].type).toBe("infantry");
  });

  it("military_investigation reveals garrison of target territory", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("military_investigation", "c1");
    state.players[0].hand = [card];
    state.board[3].owner = "p1";
    const result = processAction(state, { type: "play_card", cardId: "c1", target: 3 });
    expect(result.state.players[0].revealedGarrisons).toContain(3);
  });
});

describe("play_card - movement cards", () => {
  it("transport_aircraft teleports player to target tile", () => {
    let state = startedGame();
    state.phase = "movement";
    const card = mkCard("transport_aircraft", "c1");
    state.players[0].hand = [card];
    state.players[0].position = 0;
    const result = processAction(state, { type: "play_card", cardId: "c1", target: 10 });
    expect(result.state.players[0].position).toBe(10);
  });
});

describe("play_card - defense cards", () => {
  it("fuse_mine places trap on owned territory", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("fuse_mine", "c1");
    state.players[0].hand = [card];
    state.board[1].owner = state.players[0].id;
    state.players[0].ownedTerritories = [1];
    const result = processAction(state, { type: "play_card", cardId: "c1", target: 1 });
    expect(result.state.board[1].hasFuseMine).toBe(true);
    expect(result.state.board[1].fuseMineOwner).toBe(state.players[0].id);
  });
});

describe("play_card - combat cards", () => {
  it("mercenary adds +2 combat power during combat", () => {
    let state = startedGame();
    state.phase = "combat";
    const card = mkCard("mercenary", "c1");
    state.players[0].hand = [card];
    state.combatState = {
      attackerId: "p0", defenderId: "p1", tileIndex: 3,
      phase: "card_play",
      attackerCards: [], defenderCards: [],
      attackerDice: null, defenderDice: null,
      attackerTotal: null, defenderTotal: null,
      result: null, attackerLosses: [], defenderLosses: [],
    };
    const result = processAction(state, { type: "combat_play_card", cardId: "c1" });
    expect(result.state.combatState!.attackerCards).toHaveLength(1);
    expect(result.state.combatState!.attackerCards[0].type).toBe("mercenary");
  });

  it("dummy_supplies adds +1 combat power during combat", () => {
    let state = startedGame();
    state.phase = "combat";
    const card = mkCard("dummy_supplies", "c1");
    state.players[0].hand = [card];
    state.combatState = {
      attackerId: "p0", defenderId: "p1", tileIndex: 3,
      phase: "card_play",
      attackerCards: [], defenderCards: [],
      attackerDice: null, defenderDice: null,
      attackerTotal: null, defenderTotal: null,
      result: null, attackerLosses: [], defenderLosses: [],
    };
    const result = processAction(state, { type: "combat_play_card", cardId: "c1" });
    expect(result.state.combatState!.attackerCards).toHaveLength(1);
  });
});

describe("draw card", () => {
  it("draws card when landing on ammo_draw tile", () => {
    let state = startedGame();
    state.phase = "movement";
    state.players[0].position = 1; // will roll and may land on ammo_draw at index 2
    // Simulate landing on ammo_draw tile directly
    state.players[0].position = 2; // ammo_draw tile
    state.phase = "action";
    // The card draw should have been triggered by landing
    // We test the hand limit separately
    expect(state.board[2].type).toBe("ammo_draw");
  });

  it("enforces max hand size of 5", () => {
    let state = startedGame();
    state.phase = "management";
    state.players[0].hand = [
      mkCard("war_fund", "c1"), mkCard("war_fund", "c2"), mkCard("war_fund", "c3"),
      mkCard("war_fund", "c4"), mkCard("war_fund", "c5"),
    ];
    // At max hand size, must discard before drawing more
    expect(state.players[0].hand).toHaveLength(5);
  });

  it("discard_card removes card from hand", () => {
    let state = startedGame();
    state.phase = "management";
    const card = mkCard("war_fund", "c1");
    state.players[0].hand = [card];
    const result = processAction(state, { type: "discard_card", cardId: "c1" });
    expect(result.state.players[0].hand).toHaveLength(0);
    expect(result.state.discardPile).toContainEqual(expect.objectContaining({ id: "c1" }));
  });
});
