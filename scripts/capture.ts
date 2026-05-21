import { captureDashboardScreenshot, defaultScreenshotPath } from "../lib/captureDashboard";

async function main() {
  const output = defaultScreenshotPath();
  console.log(
    `[capture] Opening ${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
  );
  await captureDashboardScreenshot({ outputPath: output });
  console.log(`[capture] Saved screenshot to ${output}`);
}

main().catch((err) => {
  console.error("[capture] Failed:", err);
  process.exit(1);
});
