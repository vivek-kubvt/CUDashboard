import type {
  CursorAuthMeResponse,
  CursorUsageDetailResponse,
  DashboardData,
  UsageSummaryResponse,
} from "@/types/usage";
import {
  MOCK_AUTH_ME,
  MOCK_SUMMARY,
  MOCK_USAGE_DETAIL,
  buildDailySeries,
  buildModelSlices,
} from "@/lib/mockData";
import {
  normalizeAuthMe,
  normalizeUsageDetail,
  normalizeUsageSummary,
} from "@/lib/normalizeCursorApi";

const CURSOR_BASE = "https://cursor.com";

interface FetchOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULTS: Required<Omit<FetchOptions, "signal">> = {
  retries: 3,
  retryDelayMs: 600,
  timeoutMs: 12_000,
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cursorCookie(): string | null {
  const token = process.env.CURSOR_SESSION_TOKEN?.trim();
  if (!token) return null;
  // Allow either the raw token value or a full "name=value" cookie string.
  if (token.includes("=")) return token;
  return `WorkosCursorSessionToken=${token}`;
}

function shouldUseMock(): boolean {
  if (process.env.CURSOR_SESSION_TOKEN) return false;
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MOCK) {
    return false;
  }
  return true;
}

async function cursorFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const cookie = cursorCookie();
  if (!cookie) {
    throw new Error(
      "CURSOR_SESSION_TOKEN is not set. Copy the WorkosCursorSessionToken cookie value from cursor.com.",
    );
  }
  const cfg = { ...DEFAULTS, ...options };
  const url = `${CURSOR_BASE}${path}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
    options.signal?.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
          "User-Agent":
            "CursorUsageDashboard/1.0 (+https://github.com/your-org/cursor-usage-dashboard)",
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Cursor returned ${res.status}. The session token is missing/expired — refresh CURSOR_SESSION_TOKEN.`,
        );
      }
      if (!res.ok) {
        throw new Error(`Cursor ${path} returned ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Cursor ${path} returned non-JSON (${contentType || "no content-type"}). ` +
            `First 120 chars: ${body.slice(0, 120)}`,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < cfg.retries) {
        await sleep(cfg.retryDelayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Failed to fetch ${path}`);
}

export async function fetchUsageSummary(
  options: FetchOptions = {},
): Promise<UsageSummaryResponse> {
  if (shouldUseMock()) return MOCK_SUMMARY;
  const res = await cursorFetch<unknown>("/api/usage-summary", options);
  const summary = normalizeUsageSummary(res);
  if (!summary) {
    console.error(
      "[fetchUsageSummary] unexpected response shape:",
      JSON.stringify(res).slice(0, 400),
    );
    throw new Error(
      "Cursor /api/usage-summary returned an unexpected shape. " +
        "See server logs for the raw response. The session token is likely expired or the API changed.",
    );
  }
  return summary;
}

export async function fetchAuthMe(
  options: FetchOptions = {},
): Promise<CursorAuthMeResponse | null> {
  if (shouldUseMock()) return MOCK_AUTH_ME;
  try {
    const res = await cursorFetch<unknown>("/api/auth/me", options);
    const me = normalizeAuthMe(res);
    if (!me) {
      console.warn(
        "[fetchAuthMe] unexpected response shape:",
        JSON.stringify(res).slice(0, 200),
      );
      return null;
    }
    return me;
  } catch (err) {
    console.warn("[fetchAuthMe] non-fatal:", (err as Error).message);
    return null;
  }
}

export async function fetchUsageDetail(
  userId: number | string,
  options: FetchOptions = {},
): Promise<CursorUsageDetailResponse | null> {
  if (shouldUseMock()) return MOCK_USAGE_DETAIL;
  try {
    const res = await cursorFetch<unknown>(
      `/api/usage?user=${encodeURIComponent(String(userId))}`,
      options,
    );
    return normalizeUsageDetail(res);
  } catch (err) {
    console.warn("[fetchUsageDetail] non-fatal:", (err as Error).message);
    return null;
  }
}

export async function fetchDashboardData(
  options: FetchOptions = {},
): Promise<DashboardData> {
  const [summary, me] = await Promise.all([
    fetchUsageSummary(options),
    fetchAuthMe(options),
  ]);

  const userId = me?.user?.id ?? process.env.CURSOR_USER_ID ?? null;
  const detail = userId ? await fetchUsageDetail(userId, options) : null;

  return {
    summary,
    user: me?.user ?? null,
    detail,
    daily: buildDailySeries(summary.billingCycle.start, summary.billingCycle.end),
    models: buildModelSlices(detail),
    fetchedAt: new Date().toISOString(),
  };
}
