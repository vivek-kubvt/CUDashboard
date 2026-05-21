import type {
  CursorAuthMeResponse,
  CursorUsageDetailResponse,
  DailyUsagePoint,
  ModelUsageSlice,
  UsageSummaryResponse,
} from "@/types/usage";

export const MOCK_SUMMARY: UsageSummaryResponse = {
  billingCycle: {
    start: "2026-05-13T16:33:05.000Z",
    end: "2026-06-13T16:33:05.000Z",
  },
  membership: {
    type: "pro_plus",
    limitType: "user",
    isUnlimited: false,
  },
  displayMessages: {
    autoModel: "You've used 47% of your included total usage",
    namedModel: "You've used 43% of your included API usage",
  },
  individualUsage: {
    plan: {
      enabled: true,
      used: 7000,
      limit: 7000,
      remaining: 0,
      breakdown: { included: 7000, bonus: 16988, total: 23988 },
      usagePercentages: {
        autoModel: 48.145,
        api: 43,
        total: 47.035294117647055,
      },
    },
    onDemand: { enabled: false, used: 0, limit: null, remaining: null },
  },
  teamUsage: {},
};

export const MOCK_AUTH_ME: CursorAuthMeResponse = {
  user: {
    id: 317231491,
    sub: "user_01KF3F07PSRWKG1ATPE1V723HJ",
    name: "Dhruv Khatri",
    email: "dhruv.khatri@revoola.com",
    emailVerified: true,
    picture: null,
  },
  timestamps: {
    createdAt: "2026-01-16T13:13:03.947Z",
    updatedAt: "2026-05-19T06:57:04.146Z",
  },
};

export const MOCK_USAGE_DETAIL: CursorUsageDetailResponse = {
  models: {
    "gpt-4o": {
      numRequests: 482,
      numRequestsTotal: 482,
      numTokens: 11200,
      maxTokenUsage: null,
      maxRequestUsage: null,
    },
    "gpt-4o-mini": {
      numRequests: 290,
      numRequestsTotal: 290,
      numTokens: 6400,
      maxTokenUsage: null,
      maxRequestUsage: null,
    },
    "claude-sonnet-4-6": {
      numRequests: 174,
      numRequestsTotal: 174,
      numTokens: 4100,
      maxTokenUsage: null,
      maxRequestUsage: null,
    },
    "gpt-4-turbo": {
      numRequests: 70,
      numRequestsTotal: 70,
      numTokens: 1800,
      maxTokenUsage: null,
      maxRequestUsage: null,
    },
    other: {
      numRequests: 32,
      numRequestsTotal: 32,
      numTokens: 488,
      maxTokenUsage: null,
      maxRequestUsage: null,
    },
  },
  billing: { startOfMonth: "2026-05-13T16:33:05.000Z" },
};

const MODEL_PALETTE = [
  "hsl(160 84% 45%)",
  "hsl(199 89% 55%)",
  "hsl(265 80% 65%)",
  "hsl(35 92% 60%)",
  "hsl(0 84% 60%)",
  "hsl(220 10% 55%)",
];

export function buildModelSlices(
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

/** UTC midnight for an ISO timestamp (billing cycle dates are UTC). */
function utcDayStart(iso: string | Date): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Estimated per-day usage for charting. Cursor does not expose daily history;
 * values are a illustrative split capped at today (not future cycle dates).
 */
export function buildDailySeries(
  start: string,
  end: string,
  now: Date = new Date(),
): DailyUsagePoint[] {
  const cycleStart = utcDayStart(start);
  const cycleEnd = utcDayStart(end);
  const today = utcDayStart(now);
  const rangeEnd = Math.min(cycleEnd, today);

  if (rangeEnd < cycleStart) return [];

  const spanDays = Math.floor((rangeEnd - cycleStart) / 86_400_000) + 1;
  const days = Math.max(1, Math.min(31, spanDays));
  const out: DailyUsagePoint[] = [];

  for (let i = 0; i < days; i++) {
    const dayMs = cycleStart + i * 86_400_000;
    const d = new Date(dayMs);
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const base = 600 + Math.sin(i / 2) * 220 + (weekend ? -350 : 0);
    const tokens = Math.max(60, Math.round(base + ((i * 37) % 220)));
    const requests = Math.max(6, Math.round(tokens / 22 + ((i * 11) % 17)));
    out.push({ date: d.toISOString().slice(0, 10), tokens, requests });
  }
  return out;
}
