import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { screenshotScale, screenshotWidth } from "@/lib/screenshotConfig";

export interface CaptureDashboardOptions {
  baseUrl?: string;
  outputPath?: string;
}

function dashboardBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";
}

/**
 * Playwright capture of #dashboard-root — same pipeline as CI / npm run capture.
 */
export async function captureDashboardScreenshot(
  options: CaptureDashboardOptions = {},
): Promise<Buffer> {
  const target = options.baseUrl ?? dashboardBaseUrl();
  const outputPath = options.outputPath;

  const width = screenshotWidth();
  const scale = screenshotScale();

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: scale,
      colorScheme: "dark",
    });
    const page = await context.newPage();

    await page.goto(target, { waitUntil: "networkidle", timeout: 60_000 });

    try {
      await page.waitForSelector("[data-dashboard-ready]", { timeout: 60_000 });
    } catch {
      const errText = await page
        .locator("main")
        .innerText()
        .catch(() => "");
      throw new Error(
        "Dashboard did not load in time. " +
          "Check CURSOR_SESSION_TOKEN. " +
          `Page snippet: ${errText.slice(0, 200)}`,
      );
    }

    // Let Recharts finish layout/animation (CI headless can be slower).
    await page.waitForTimeout(process.env.CI === "true" ? 3500 : 2000);

    const root = page.locator("#dashboard-root");
    const scrollHeight = await root.evaluate((el) => el.scrollHeight);
    const height = Math.min(Math.max(scrollHeight + 48, 900), 16_000);
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(400);

    const buffer = await root.screenshot({
      type: "png",
      animations: "disabled",
    });

    if (outputPath) {
      const resolved = resolve(process.cwd(), outputPath);
      await mkdir(dirname(resolved), { recursive: true });
      await writeFile(resolved, buffer);
    }

    return buffer;
  } finally {
    await browser.close();
  }
}

export function defaultScreenshotPath(): string {
  return resolve(
    process.cwd(),
    process.env.SCREENSHOT_PATH ?? "public/usage-report.png",
  );
}
