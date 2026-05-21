import { NextResponse } from "next/server";
import {
  captureDashboardScreenshot,
  defaultScreenshotPath,
} from "@/lib/captureDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const buffer = await captureDashboardScreenshot({
      outputPath: defaultScreenshotPath(),
    });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Disposition":
          'attachment; filename="cursor-usage-dashboard.png"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Screenshot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
