import { readFile } from "node:fs/promises";
import { defaultScreenshotPath } from "../lib/captureDashboard";
import { publishScreenshotUrl } from "../lib/publishScreenshotUrl";

async function main() {
  const path = defaultScreenshotPath();
  const bytes = await readFile(path);
  const url = await publishScreenshotUrl(bytes);
  process.stdout.write(url);
}

main().catch((err) => {
  console.error("[publish] Failed:", err);
  process.exit(1);
});
