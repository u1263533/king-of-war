import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Landing page
await page.goto('http://localhost:5180');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/01-landing.png', fullPage: false });

// Click PLAY NOW
await page.click('text=PLAY NOW');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/02-setup.png', fullPage: false });

// Start game with 2 players classic
await page.click('text=START BATTLE');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/03-game-movement.png', fullPage: false });

// Roll dice
await page.click('text=ROLL DICE');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/04-game-action.png', fullPage: false });

// Pass or buy depending on what's available
const buyBtn = page.locator('button:has-text("BUY")');
const passBtn = page.locator('button:has-text("PASS")');
if (await buyBtn.count() > 0) {
  await buyBtn.first().click();
} else if (await passBtn.count() > 0) {
  await passBtn.first().click();
}
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/05-game-management.png', fullPage: false });

// Click recruit
const recruitBtn = page.locator('button:has-text("RECRUIT")');
if (await recruitBtn.count() > 0) {
  await recruitBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/06-recruit-modal.png', fullPage: false });
  // Close modal
  await page.click('text=CLOSE');
}

// End turn and wait for AI
await page.click('text=END TURN');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/07-after-ai.png', fullPage: false });

await browser.close();
console.log('Screenshots saved to screenshots/');
