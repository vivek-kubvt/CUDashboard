import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const TARGET = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const OUTPUT = resolve(
  process.cwd(),
  process.env.SCREENSHOT_PATH ?? "public/usage-report.png",
);

async function main() {
  console.log(`[capture] Opening ${TARGET}`);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1800 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    });
    const page = await context.newPage();

    await page.goto(TARGET, { waitUntil: "networkidle", timeout: 60_000 });

    await page.waitForSelector("[data-dashboard-ready]", { timeout: 30_000 });
    // Wait for chart animations to settle.
    await page.waitForTimeout(1500);

    await mkdir(dirname(OUTPUT), { recursive: true });
    const root = page.locator("#dashboard-root");
    await root.screenshot({ path: OUTPUT, type: "png" });
    console.log(`[capture] Saved screenshot to ${OUTPUT}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[capture] Failed:", err);
  process.exit(1);
});
