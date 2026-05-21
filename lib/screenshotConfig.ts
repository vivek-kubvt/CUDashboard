/** Logical viewport width before deviceScaleFactor (default 1920). */
export function screenshotWidth(): number {
  const n = Number(process.env.SCREENSHOT_WIDTH);
  if (Number.isFinite(n) && n >= 1280 && n <= 3840) return Math.round(n);
  return 1920;
}

/**
 * Device pixel ratio for Playwright / html-to-image (default 3 = sharp text & charts).
 * Override with SCREENSHOT_SCALE=2|3|4 in .env or GitHub Actions env.
 */
export function screenshotScale(): number {
  const n = Number(process.env.SCREENSHOT_SCALE);
  if (Number.isFinite(n) && n >= 1 && n <= 4) return n;
  return 3;
}
