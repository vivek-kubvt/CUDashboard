/**
 * Google Chat must fetch imageUrl without auth — private GitHub raw URLs always fail.
 */
export async function isPublicImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const type = res.headers.get("content-type") ?? "";
    return (
      res.ok &&
      (type.includes("image/png") ||
        type.includes("image/jpeg") ||
        type.includes("octet-stream"))
    );
  } catch {
    return false;
  }
}
