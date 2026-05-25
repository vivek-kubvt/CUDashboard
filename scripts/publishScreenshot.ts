import { readFile } from "node:fs/promises";
import { defaultScreenshotPath } from "../lib/captureDashboard";
import { prepareScreenshotForChat } from "../lib/screenshotEncode";
import { screenshotFileName } from "../lib/screenshotConfig";
import { publishScreenshotUrl } from "../lib/publishScreenshotUrl";

async function main() {
  const path = defaultScreenshotPath();
  const bytes = await readFile(path);
  const prepared = await prepareScreenshotForChat(bytes, screenshotFileName());
  const url = await publishScreenshotUrl(
    prepared.buffer,
    prepared.filename,
    prepared.contentType,
  );
  process.stdout.write(url);
}

main().catch((err) => {
  console.error("[publish] Failed:", err);
  process.exit(1);
});
