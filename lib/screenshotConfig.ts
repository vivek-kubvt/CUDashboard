export type ScreenshotFormat = "png" | "jpeg";

/** Logical viewport width before deviceScaleFactor (default 2560). */
export function screenshotWidth(): number {
  const n = Number(process.env.SCREENSHOT_WIDTH);
  if (Number.isFinite(n) && n >= 1280 && n <= 3840) return Math.round(n);
  return 2560;
}

/**
 * Device pixel ratio for Playwright / html-to-image (default 4 = very sharp).
 * Override with SCREENSHOT_SCALE=2|3|4 in .env or GitHub Actions env.
 */
export function screenshotScale(): number {
  const n = Number(process.env.SCREENSHOT_SCALE);
  if (Number.isFinite(n) && n >= 1 && n <= 4) return n;
  return 4;
}

/** Capture format: png (lossless) or jpeg (smaller; Google Chat supports both). */
export function screenshotFormat(): ScreenshotFormat {
  const v = process.env.SCREENSHOT_FORMAT?.trim().toLowerCase();
  if (v === "jpeg" || v === "jpg") return "jpeg";
  return "png";
}

/** JPEG quality for Playwright capture and encode fallback (default 98). */
export function screenshotJpegQuality(): number {
  const n = Number(process.env.SCREENSHOT_JPEG_QUALITY);
  if (Number.isFinite(n) && n >= 80 && n <= 100) return Math.round(n);
  return 98;
}

/** Max viewport height when capturing tall dashboards (default 12000). */
export function screenshotMaxHeight(): number {
  const n = Number(process.env.SCREENSHOT_MAX_HEIGHT);
  if (Number.isFinite(n) && n >= 900 && n <= 16_000) return Math.round(n);
  return 12_000;
}

/** Google Chat card image size guidance (~2MB). */
export function googleChatMaxImageBytes(): number {
  const n = Number(process.env.SCREENSHOT_CHAT_MAX_BYTES);
  if (Number.isFinite(n) && n >= 500_000 && n <= 2_000_000) {
    return Math.round(n);
  }
  return 1_950_000;
}

export function screenshotFileName(): string {
  const fromPath = process.env.SCREENSHOT_PATH?.trim();
  if (fromPath) {
    const base = fromPath.replace(/^.*[/\\]/, "");
    if (base) return base;
  }
  return screenshotFormat() === "jpeg" ? "usage-report.jpg" : "usage-report.png";
}

export function screenshotMimeType(): string {
  return screenshotFormat() === "jpeg" ? "image/jpeg" : "image/png";
}
