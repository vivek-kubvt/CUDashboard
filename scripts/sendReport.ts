import { fetchAuthMe, fetchUsageSummary } from "../lib/fetchUsage";
import { sendUsageReport } from "../lib/googleChat";

async function main() {
  const screenshotUrl = process.env.SCREENSHOT_URL;
  console.log("[report] Fetching Cursor usage…");
  const [summary, me] = await Promise.all([fetchUsageSummary(), fetchAuthMe()]);
  console.log("[report] Posting to Google Chat…");
  await sendUsageReport(summary, me?.user ?? null, screenshotUrl);
  console.log("[report] Report sent.");
}

main().catch((err) => {
  console.error("[report] Failed:", err);
  process.exit(1);
});
