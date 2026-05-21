import { cursorPost } from "@/lib/cursorClient";
import type {
  BillingCycle,
  CursorUsageEvent,
  DailyUsagePoint,
  FilteredUsageEventsRequest,
  FilteredUsageEventsResponse,
  ModelUsageSlice,
} from "@/types/usage";

const EVENTS_PATH = "/api/dashboard/get-filtered-usage-events";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const RECENT_EVENTS_LIMIT = 50;

const MODEL_PALETTE = [
  "hsl(160 84% 45%)",
  "hsl(199 89% 55%)",
  "hsl(265 80% 65%)",
  "hsl(35 92% 60%)",
  "hsl(0 84% 60%)",
  "hsl(220 10% 55%)",
];

function utcDayStart(iso: string | Date): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dateKeyFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function resolveTeamId(): number {
  const raw = process.env.CURSOR_TEAM_ID?.trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Same shape as the Cursor dashboard usage page POST (see browser Network tab).
 * Dates are Unix ms as strings; endDate is last ms of the final day in range.
 */
export function buildUsageEventsRequest(
  billingCycle: BillingCycle,
  options: {
    userId?: number | null;
    teamId?: number;
    now?: Date;
    page?: number;
    pageSize?: number;
  } = {},
): FilteredUsageEventsRequest {
  const now = options.now ?? new Date();
  const startMs = utcDayStart(billingCycle.start);
  const cycleEndMs = utcDayStart(billingCycle.end);
  const todayMs = utcDayStart(now);
  const lastDayMs = Math.min(cycleEndMs, todayMs);

  const req: FilteredUsageEventsRequest = {
    teamId: options.teamId ?? resolveTeamId(),
    startDate: String(startMs),
    endDate: String(lastDayMs + 86_400_000 - 1),
    page: options.page ?? 1,
    pageSize: options.pageSize ?? PAGE_SIZE,
  };
  if (options.userId != null) req.userId = options.userId;
  return req;
}

export function eventTokens(event: CursorUsageEvent): number {
  const u = event.tokenUsage;
  if (!u) return 0;
  return (
    (u.inputTokens ?? 0) +
    (u.outputTokens ?? 0) +
    (u.cacheReadTokens ?? 0) +
    (u.cacheWriteTokens ?? 0)
  );
}

export function sortEventsNewestFirst(
  events: CursorUsageEvent[],
): CursorUsageEvent[] {
  return [...events].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );
}

export async function fetchUsageEvents(
  billingCycle: BillingCycle,
  userId?: number | null,
  now: Date = new Date(),
): Promise<CursorUsageEvent[]> {
  const base = buildUsageEventsRequest(billingCycle, { userId, now });
  const events: CursorUsageEvent[] = [];
  let total = Infinity;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await cursorPost<FilteredUsageEventsResponse>(
      EVENTS_PATH,
      { ...base, page },
      { timeoutMs: 30_000 },
    );
    const batch = res.usageEventsDisplay ?? [];
    total = res.totalUsageEventsCount ?? batch.length;
    events.push(...batch);
    if (events.length >= total || batch.length < base.pageSize) break;
  }

  return events;
}

export function buildDailySeriesFromEvents(
  events: CursorUsageEvent[],
  billingCycle: BillingCycle,
  now: Date = new Date(),
): DailyUsagePoint[] {
  const startMs = utcDayStart(billingCycle.start);
  const endMs = Math.min(
    utcDayStart(billingCycle.end),
    utcDayStart(now),
  );
  if (endMs < startMs) return [];

  const byDay = new Map<string, { tokens: number; requests: number }>();
  for (const event of events) {
    const ts = Number(event.timestamp);
    if (!Number.isFinite(ts)) continue;
    const key = dateKeyFromMs(ts);
    const dayMs = utcDayStart(key);
    if (dayMs < startMs || dayMs > endMs) continue;
    const row = byDay.get(key) ?? { tokens: 0, requests: 0 };
    row.tokens += eventTokens(event);
    row.requests += 1;
    byDay.set(key, row);
  }

  const out: DailyUsagePoint[] = [];
  for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
    const key = dateKeyFromMs(ms);
    const row = byDay.get(key) ?? { tokens: 0, requests: 0 };
    out.push({ date: key, tokens: row.tokens, requests: row.requests });
  }
  return out;
}

export function buildModelSlicesFromEvents(
  events: CursorUsageEvent[],
): ModelUsageSlice[] {
  const byModel = new Map<string, { tokens: number; requests: number }>();
  for (const event of events) {
    const model = event.model?.trim() || "unknown";
    const row = byModel.get(model) ?? { tokens: 0, requests: 0 };
    row.tokens += eventTokens(event);
    row.requests += 1;
    byModel.set(model, row);
  }

  const entries = [...byModel.entries()]
    .filter(([, v]) => v.tokens > 0 || v.requests > 0)
    .sort((a, b) => b[1].tokens - a[1].tokens);

  return entries.map(([model, stats], i) => ({
    model,
    tokens: stats.tokens,
    requests: stats.requests,
    color: MODEL_PALETTE[i % MODEL_PALETTE.length],
  }));
}

export function recentEventsForDisplay(
  events: CursorUsageEvent[],
  limit = RECENT_EVENTS_LIMIT,
): CursorUsageEvent[] {
  return sortEventsNewestFirst(events).slice(0, limit);
}
