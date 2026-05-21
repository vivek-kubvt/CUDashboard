import { readFile } from "node:fs/promises";
import { defaultScreenshotPath } from "../lib/captureDashboard";

/**
 * Uploads the captured PNG to a temporary public host so Google Chat can embed it.
 * Prints the URL to stdout (used by GitHub Actions).
 */
async function main() {
  const path = defaultScreenshotPath();
  const bytes = await readFile(path);
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append(
    "fileToUpload",
    new Blob([bytes], { type: "image/png" }),
    "usage-report.png",
  );

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error(`Unexpected upload response: ${url.slice(0, 120)}`);
  }
  process.stdout.write(url);
}

main().catch((err) => {
  console.error("[publish] Failed:", err);
  process.exit(1);
});
