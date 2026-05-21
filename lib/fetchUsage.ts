import type {
  CursorAuthMeResponse,
  CursorUsageDetailResponse,
  DashboardData,
  ModelUsageSlice,
  UsageSummaryResponse,
} from "@/types/usage";
import { cursorGet } from "@/lib/cursorClient";
import {
  normalizeAuthMe,
  normalizeUsageDetail,
  normalizeUsageSummary,
} from "@/lib/normalizeCursorApi";
import {
  buildDailySeriesFromEvents,
  buildModelSlicesFromEvents,
  fetchUsageEvents,
} from "@/lib/usageEvents";

interface FetchOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const MODEL_PALETTE = [
  "hsl(160 84% 45%)",
  "hsl(199 89% 55%)",
  "hsl(265 80% 65%)",
  "hsl(35 92% 60%)",
  "hsl(0 84% 60%)",
  "hsl(220 10% 55%)",
];

function buildModelSlicesFromDetail(
  detail: CursorUsageDetailResponse | null,
): ModelUsageSlice[] {
  if (!detail) return [];
  const entries = Object.entries(detail.models)
    .map(([model, m]) => ({
      model,
      tokens: m.numTokens,
      requests: m.numRequests,
    }))
    .filter((m) => m.tokens > 0 || m.requests > 0)
    .sort((a, b) => b.tokens - a.tokens);

  return entries.map((m, i) => ({
    ...m,
    color: MODEL_PALETTE[i % MODEL_PALETTE.length],
  }));
}

export async function fetchUsageSummary(
  options: FetchOptions = {},
): Promise<UsageSummaryResponse> {
  const res = await cursorGet<unknown>("/api/usage-summary", options);
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
  try {
    const res = await cursorGet<unknown>("/api/auth/me", options);
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
  try {
    const res = await cursorGet<unknown>(
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

  const envUserId = process.env.CURSOR_USER_ID?.trim();
  const userId =
    me?.user?.id ??
    (envUserId && !Number.isNaN(Number(envUserId)) ? Number(envUserId) : null);
  const detail = userId ? await fetchUsageDetail(userId, options) : null;

  const events = await fetchUsageEvents(
    summary.billingCycle,
    userId,
  );

  const daily = buildDailySeriesFromEvents(events, summary.billingCycle);
  const modelsFromEvents = buildModelSlicesFromEvents(events);
  const models =
    modelsFromEvents.length > 0
      ? modelsFromEvents
      : buildModelSlicesFromDetail(detail);

  return {
    summary,
    user: me?.user ?? null,
    detail,
    daily,
    models,
    usageEventsCount: events.length,
    fetchedAt: new Date().toISOString(),
  };
}
