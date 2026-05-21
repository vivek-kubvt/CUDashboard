import { sendDashboardScreenshot } from "../lib/googleChat";
import { isPublicImageUrl } from "../lib/verifyImageUrl";

async function main() {
  const screenshotUrl = process.env.SCREENSHOT_URL?.trim();
  if (!screenshotUrl) {
    console.error(
      "[report] SCREENSHOT_URL is missing. Run capture + publish first, or set the SCREENSHOT_URL repository secret.",
    );
    process.exit(1);
  }

  const ok = await isPublicImageUrl(screenshotUrl);
  if (!ok) {
    console.error(
      "[report] SCREENSHOT_URL is not publicly reachable by Google Chat (private GitHub raw URLs do not work).",
    );
    console.error(`[report] URL: ${screenshotUrl}`);
    console.error(
      "[report] Use a public repo, a Cloudinary/S3 URL in SCREENSHOT_URL secret, or download the workflow artifact.",
    );
    process.exit(1);
  }

  console.log(`[report] Posting dashboard screenshot only: ${screenshotUrl}`);
  await sendDashboardScreenshot(screenshotUrl);
  console.log("[report] Screenshot sent to Google Chat.");
}

main().catch((err) => {
  console.error("[report] Failed:", err);
  process.exit(1);
});
