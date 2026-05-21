import { toPng } from "html-to-image";

function dashboardBackgroundColor(): string {
  const bg = getComputedStyle(document.documentElement).getPropertyValue(
    "--background",
  );
  const trimmed = bg.trim();
  if (trimmed) return `hsl(${trimmed})`;
  return "hsl(220 18% 6%)";
}

/**
 * Captures the live dashboard DOM and triggers a PNG download in the browser.
 */
export async function downloadDashboardPng(
  elementId = "dashboard-root",
): Promise<void> {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error("Dashboard is not ready to capture yet.");
  }

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: dashboardBackgroundColor(),
    style: {
      margin: "0",
    },
  });

  const link = document.createElement("a");
  link.download = `cursor-usage-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}
