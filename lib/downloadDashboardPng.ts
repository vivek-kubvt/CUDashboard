import { toPng } from "html-to-image";

function dashboardBackgroundColor(): string {
  const bg = getComputedStyle(document.documentElement).getPropertyValue(
    "--background",
  );
  const trimmed = bg.trim();
  if (trimmed) return `hsl(${trimmed})`;
  return "hsl(220 18% 6%)";
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

async function captureInBrowser(elementId: string): Promise<Blob> {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error("Dashboard is not ready to capture yet.");
  }

  const dataUrl = await toPng(node, {
    pixelRatio: 4,
    cacheBust: true,
    backgroundColor: dashboardBackgroundColor(),
    skipFonts: false,
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      return !el.classList.contains("recharts-tooltip-wrapper");
    },
    style: { margin: "0" },
  });

  const res = await fetch(dataUrl);
  return res.blob();
}

async function captureViaServer(): Promise<Blob> {
  const res = await fetch("/api/screenshot", { method: "POST" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      body?.error ??
        "Server screenshot failed. Run `npm run dev` and ensure Playwright is installed (`npx playwright install chromium`).",
    );
  }
  return res.blob();
}

/**
 * Captures the full dashboard and downloads a PNG.
 * Tries in-browser capture first; falls back to Playwright (same as CI).
 */
export async function downloadDashboardPng(
  elementId = "dashboard-root",
): Promise<void> {
  const filename = `cursor-usage-${new Date().toISOString().slice(0, 10)}.png`;

  let blob: Blob;
  try {
    blob = await captureViaServer();
  } catch {
    blob = await captureInBrowser(elementId);
  }

  triggerBlobDownload(blob, filename);
}
