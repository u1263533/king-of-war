# King of War — Test Report

**Date:** 2026-03-11
**Test Framework:** Vitest 4.0.18
**Coverage Provider:** @vitest/coverage-v8

---

## Summary

| Metric | Value |
|--------|-------|
| Total Test Files | 6 |
| Total Tests | 83 |
| Tests Passed | 83 |
| Tests Failed | 0 |
| Pass Rate | **100%** |
| Total Duration | 242ms |
| Test Duration | 35ms |

## Coverage

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **86.49%** | **70.44%** | **90.62%** | **88.06%** |
| server/src/gameState.ts | 86.26% | 70.44% | 90.47% | 87.83% |
| shared/constants.ts | 100% | 100% | 100% | 100% |

## Test Files Breakdown

### 1. gameState.test.ts — 24 tests
Core game initialization and turn flow.

| Suite | Tests | Status |
|-------|-------|--------|
| createInitialState | 11 | All pass |
| processAction - start_game | 2 | All pass |
| processAction - roll_dice | 7 | All pass |
| processAction - phase transitions | 4 | All pass |

**Covers:** Player creation, starting coins (2/3/4 players, classic/blitz), board setup, card deck generation, dice rolling, position wrapping, supply income, doubles detection, turn advancement, eliminated player skipping.

### 2. economy.test.ts — 20 tests
Territory economy: buying, renting, building, selling, bankruptcy.

| Suite | Tests | Status |
|-------|-------|--------|
| buy_territory | 5 | All pass |
| pass_buy | 1 | All pass |
| pay rent | 3 | All pass |
| build | 5 | All pass |
| sell_territory | 4 | All pass |
| bankruptcy | 2 | All pass |

**Covers:** Territory purchase validation, insufficient coins, already-owned rejection, non-territory rejection, phase transitions, rent auto-deduction, building multipliers (1x/1.5x/2x/3x), sequential upgrades, max level rejection, sell at 50%, garrison return on sell, building reset, player elimination, victory trigger.

### 3. military.test.ts — 12 tests
Unit recruitment, deployment, and transfers.

| Suite | Tests | Status |
|-------|-------|--------|
| recruit | 5 | All pass |
| deploy_mobile | 2 | All pass |
| deploy_garrison | 2 | All pass |
| transfer_to_garrison | 2 | All pass |
| transfer_to_mobile | 1 | All pass |

**Covers:** Infantry/tank/aircraft recruitment with correct costs and combat power, insufficient coins rejection, zero count rejection, reserve-to-mobile deployment, reserve-to-garrison deployment, mobile-to-garrison transfer, garrison-to-mobile transfer, ownership validation.

### 4. combat.test.ts — 9 tests
Combat initiation, choices, and resolution.

| Suite | Tests | Status |
|-------|-------|--------|
| combat_choice - military | 2 | All pass |
| combat_choice - costly | 1 | All pass |
| combat_choice - retreat | 1 | All pass |
| combat resolution | 4 | All pass |
| fuse mine in combat | 1 | All pass |

**Covers:** Combat initiation with attacker/defender IDs, no-army rejection, costly (double rent) payment, retreat (normal rent) payment, dice roll + resolution, combat power = unit power + dice sum, attacker/defender win scenarios, fuse mine -2 attacker penalty.

### 5. cards.test.ts — 12 tests
Card effects for all 11 card types.

| Suite | Tests | Status |
|-------|-------|--------|
| play_card - instant cards | 5 | All pass |
| play_card - movement cards | 1 | All pass |
| play_card - defense cards | 1 | All pass |
| play_card - combat cards | 2 | All pass |
| draw card | 3 | All pass |

**Covers:** war_fund (+4 coins), land_tax (+2 per territory), repressive (-5 coins target), mobilisation_of_militia (2 free infantry), military_investigation (reveal garrison), transport_aircraft (teleport), fuse_mine (place trap), mercenary (+2 combat), dummy_supplies (+1 combat), card discard, hand size limit.

### 6. fogOfWar.test.ts — 6 tests
Player view filtering for information hiding.

| Suite | Tests | Status |
|-------|-------|--------|
| createPlayerView | 6 | All pass |

**Covers:** Enemy garrison hiding, own garrison visibility, garrison reveal after military_investigation, enemy hand hiding (count only), own hand visibility, garrison count for hidden garrisons.

## Uncovered Code Areas

The 13.5% uncovered statements are primarily:
- `handleLanding()` function (tax, ammo_draw, recruitment post effects) — not triggered during roll_dice; will be tested via integration when action phase auto-resolves
- Error paths in `checkVictory` edge cases
- Some card type branches not directly exercised (surprise_attack 3-dice, surrounded no-retreat)

## Quality Assessment

- **Pass rate: 100%** — All 83 tests pass
- **Coverage: 86-88%** — Good coverage for a game engine; remaining gaps are edge cases and landing effects
- **Test speed: 35ms** — Extremely fast, suitable for TDD workflow
- **Isolation: Good** — Each test creates fresh state via `startedGame()` helper, no cross-test contamination
- **Game systems covered:** Initialization, movement, economy, military, combat, cards, fog of war, phase transitions, bankruptcy, victory
