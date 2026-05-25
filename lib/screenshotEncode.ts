import sharp from "sharp";
import {
  googleChatMaxImageBytes,
  screenshotJpegQuality,
} from "@/lib/screenshotConfig";

export type PreparedScreenshot = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

function filenameWithExt(name: string, ext: "png" | "jpg"): string {
  const base = name.replace(/\.(png|jpe?g)$/i, "") || "usage-report";
  return `${base}.${ext}`;
}

async function asJpegUnderLimit(
  input: Buffer,
  maxBytes: number,
  startQuality: number,
): Promise<Buffer> {
  let quality = startQuality;
  let last = await sharp(input).jpeg({ quality, mozjpeg: true }).toBuffer();

  while (last.length > maxBytes && quality > 82) {
    quality -= 2;
    last = await sharp(input).jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  return last;
}

/**
 * Keeps maximum visual quality while fitting Google Chat's ~2MB card image limit.
 * Prefers PNG when it already fits; otherwise encodes high-quality JPEG.
 */
export async function prepareScreenshotForChat(
  bytes: Buffer,
  filename = "usage-report.png",
): Promise<PreparedScreenshot> {
  const maxBytes = googleChatMaxImageBytes();
  const startQuality = screenshotJpegQuality();

  if (bytes.length <= maxBytes) {
    const meta = await sharp(bytes).metadata();
    const isJpeg = meta.format === "jpeg" || meta.format === "jpg";
    return {
      buffer: bytes,
      filename: isJpeg
        ? filenameWithExt(filename, "jpg")
        : filenameWithExt(filename, "png"),
      contentType: isJpeg ? "image/jpeg" : "image/png",
    };
  }

  const jpeg = await asJpegUnderLimit(bytes, maxBytes, startQuality);
  return {
    buffer: jpeg,
    filename: filenameWithExt(filename, "jpg"),
    contentType: "image/jpeg",
  };
}
