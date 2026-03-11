import { test } from "@playwright/test";

const BASE = "http://localhost:5180";

test("01 - Landing Page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/01-landing.png", fullPage: false });
});

test("02 - How to Play", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=How to Play");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/02-how-to-play.png", fullPage: false });
});

test("03 - Lobby Create Room", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=MULTIPLAYER LOBBY");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/03-lobby-create.png", fullPage: false });
});

test("04 - Lobby Join Room", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=MULTIPLAYER LOBBY");
  await page.waitForTimeout(300);
  await page.click("text=JOIN ROOM");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/04-lobby-join.png", fullPage: false });
});

test("05 - Game Screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=PLAY NOW");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/05-game-screen.png", fullPage: false });
});

test("06 - Game Screen with tile selected", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=PLAY NOW");
  await page.waitForTimeout(800);
  // Click on a tile (Ironclad City area)
  const board = page.locator("svg").first();
  await board.click({ position: { x: 400, y: 80 } });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/06-tile-selected.png", fullPage: false });
});

test("07 - Combat Overlay", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=PLAY NOW");
  await page.waitForTimeout(800);
  await page.click("text=Demo: Combat");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/07-combat-choice.png", fullPage: false });
});

test("08 - Combat Battle", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=PLAY NOW");
  await page.waitForTimeout(800);
  await page.click("text=Demo: Combat");
  await page.waitForTimeout(300);
  await page.click("text=MILITARY BATTLE");
  await page.waitForTimeout(300);
  await page.click("text=ROLL DICE");
  await page.waitForTimeout(2200);
  await page.screenshot({ path: "screenshots/08-combat-result.png", fullPage: false });
});

test("09 - Victory Screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.click("text=PLAY NOW");
  await page.waitForTimeout(800);
  await page.click("text=Demo: Victory");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/09-victory.png", fullPage: false });
});
