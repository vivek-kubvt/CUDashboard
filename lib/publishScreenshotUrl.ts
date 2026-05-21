import { isPublicImageUrl } from "@/lib/verifyImageUrl";

const USER_AGENT = "cursor-usage-dashboard/1.0";
const SCREENSHOT_BRANCH =
  process.env.SCREENSHOT_GIT_BRANCH?.trim() || "dashboard-screenshot";

type UploadFn = (bytes: Buffer, filename: string) => Promise<string>;

async function isPrivateGitHubRepo(
  token: string,
  owner: string,
  name: string,
): Promise<boolean> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: githubHeaders(token),
  });
  if (!res.ok) return true;
  const meta = (await res.json()) as { private?: boolean };
  return meta.private === true;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  };
}

async function ensureScreenshotBranch(
  token: string,
  owner: string,
  name: string,
): Promise<void> {
  const refPath = `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${SCREENSHOT_BRANCH}`;
  const existing = await fetch(refPath, { headers: githubHeaders(token) });
  if (existing.ok) return;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: githubHeaders(token),
  });
  if (!repoRes.ok) {
    throw new Error(`GitHub repo lookup failed (${repoRes.status})`);
  }
  const repoMeta = (await repoRes.json()) as { default_branch?: string };
  const defaultBranch = repoMeta.default_branch ?? "main";

  const baseRef = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${defaultBranch}`,
    { headers: githubHeaders(token) },
  );
  if (!baseRef.ok) {
    throw new Error(`GitHub default branch ref failed (${baseRef.status})`);
  }
  const base = (await baseRef.json()) as { object?: { sha?: string } };
  const sha = base.object?.sha;
  if (!sha) throw new Error("Missing default branch SHA");

  const create = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/refs`,
    {
      method: "POST",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${SCREENSHOT_BRANCH}`,
        sha,
      }),
    },
  );
  if (!create.ok && create.status !== 422) {
    const body = await create.text().catch(() => "");
    throw new Error(`GitHub branch create failed (${create.status}): ${body.slice(0, 200)}`);
  }
}

/** Push PNG to a repo branch; Google Chat can load raw.githubusercontent.com URLs. */
async function uploadGitHubRaw(bytes: Buffer, filename: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN or GITHUB_REPOSITORY not set");
  }

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repo}`);
  }

  await ensureScreenshotBranch(token, owner, name);

  const apiPath = `https://api.github.com/repos/${owner}/${name}/contents/${filename}`;
  let sha: string | undefined;

  const existing = await fetch(`${apiPath}?ref=${SCREENSHOT_BRANCH}`, {
    headers: githubHeaders(token),
  });
  if (existing.ok) {
    const meta = (await existing.json()) as { sha?: string };
    sha = meta.sha;
  } else if (existing.status !== 404) {
    throw new Error(`GitHub read failed (${existing.status})`);
  }

  const put = await fetch(apiPath, {
    method: "PUT",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "chore: update dashboard screenshot [skip ci]",
      content: bytes.toString("base64"),
      branch: SCREENSHOT_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(`GitHub write failed (${put.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await put.json()) as {
    content?: { download_url?: string };
  };
  const downloadUrl = payload.content?.download_url?.trim();
  if (!downloadUrl) {
    throw new Error("GitHub response missing content.download_url");
  }
  return downloadUrl;
}

async function uploadTransferSh(bytes: Buffer, filename: string): Promise<string> {
  const res = await fetch(`https://transfer.sh/${filename}`, {
    method: "PUT",
    body: new Uint8Array(bytes),
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "image/png",
    },
  });
  if (!res.ok) {
    throw new Error(`transfer.sh responded ${res.status}`);
  }
  const url = (await res.text()).trim().split("\n")[0]?.trim() ?? "";
  if (!url.startsWith("http")) {
    throw new Error(`transfer.sh unexpected body: ${url.slice(0, 80)}`);
  }
  return url;
}

async function upload0x0(bytes: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: "image/png" }), filename);
  const res = await fetch("https://0x0.st", {
    method: "POST",
    body: form,
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`0x0.st responded ${res.status}`);
  }
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error(`0x0.st unexpected body: ${url.slice(0, 80)}`);
  }
  return url;
}

async function uploadLitterbox(bytes: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append(
    "fileToUpload",
    new Blob([new Uint8Array(bytes)], { type: "image/png" }),
    filename,
  );
  form.append("time", "24h");

  const res = await fetch(
    "https://litterbox.catbox.moe/resources/internals/upload.php",
    {
      method: "POST",
      body: form,
      headers: { "User-Agent": USER_AGENT },
    },
  );
  if (!res.ok) {
    throw new Error(`litterbox responded ${res.status}`);
  }
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) {
    throw new Error(`litterbox unexpected body: ${url.slice(0, 80)}`);
  }
  return url;
}

async function buildUploaders(): Promise<Array<{ name: string; upload: UploadFn }>> {
  const external: Array<{ name: string; upload: UploadFn }> = [
    { name: "transfer.sh", upload: uploadTransferSh },
    { name: "0x0.st", upload: upload0x0 },
    { name: "litterbox", upload: uploadLitterbox },
  ];

  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (!token || !repo) return external;

  const [owner, name] = repo.split("/");
  if (!owner || !name) return external;

  const isPrivate = await isPrivateGitHubRepo(token, owner, name);
  if (isPrivate) {
    console.error(
      "[publish] Repository is private — GitHub raw URLs cannot be embedded in Google Chat. Trying external hosts…",
    );
    return external;
  }

  return [{ name: "github-raw", upload: uploadGitHubRaw }, ...external];
}

/**
 * Upload PNG bytes to a temporary public HTTPS URL for Google Chat embeds.
 * Tries several hosts (catbox blocks many CI IPs with HTTP 412).
 */
export async function publishScreenshotUrl(
  bytes: Buffer,
  filename = "usage-report.png",
): Promise<string> {
  const errors: string[] = [];

  for (const { name, upload } of await buildUploaders()) {
    try {
      const url = await upload(bytes, filename);
      if (!(await isPublicImageUrl(url))) {
        throw new Error("URL is not publicly reachable (Google Chat cannot load it)");
      }
      console.error(`[publish] Uploaded via ${name} (verified public)`);
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[publish] ${name} failed: ${msg}`);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(
    `All upload hosts failed.\n${errors.join("\n")}\n` +
      "Set SCREENSHOT_URL manually (S3, Cloudinary, etc.) or download the workflow artifact.",
  );
}
