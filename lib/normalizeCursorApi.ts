import type {
  CursorAuthMeResponse,
  CursorModelUsage,
  CursorUsageDetailResponse,
  IndividualUsage,
  OnDemandUsage,
  UsagePlan,
  UsageSummaryResponse,
} from "@/types/usage";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizePlan(raw: Record<string, unknown>): UsagePlan {
  const breakdown = isRecord(raw.breakdown)
    ? {
        included: Number(raw.breakdown.included ?? 0),
        bonus: Number(raw.breakdown.bonus ?? 0),
        total: Number(raw.breakdown.total ?? 0),
      }
    : { included: 0, bonus: 0, total: 0 };

  const legacyPct = isRecord(raw.usagePercentages)
    ? raw.usagePercentages
    : null;

  return {
    enabled: Boolean(raw.enabled),
    used: Number(raw.used ?? 0),
    limit: Number(raw.limit ?? 0),
    remaining: Number(raw.remaining ?? 0),
    breakdown,
    usagePercentages: {
      autoModel: Number(
        legacyPct?.autoModel ?? raw.autoPercentUsed ?? 0,
      ),
      api: Number(legacyPct?.api ?? raw.apiPercentUsed ?? 0),
      total: Number(legacyPct?.total ?? raw.totalPercentUsed ?? 0),
    },
  };
}

function normalizeOnDemand(raw: unknown): OnDemandUsage {
  if (!isRecord(raw)) {
    return { enabled: false, used: 0, limit: null, remaining: null };
  }
  return {
    enabled: Boolean(raw.enabled),
    used: Number(raw.used ?? 0),
    limit: raw.limit == null ? null : Number(raw.limit),
    remaining: raw.remaining == null ? null : Number(raw.remaining),
  };
}

function normalizeIndividualUsage(raw: unknown): IndividualUsage | null {
  if (!isRecord(raw) || !isRecord(raw.plan)) return null;
  return {
    plan: normalizePlan(raw.plan),
    onDemand: normalizeOnDemand(raw.onDemand),
  };
}

/** Legacy nested shape from early Cursor dashboard APIs. */
function isLegacyUsageSummary(o: Record<string, unknown>): boolean {
  const bc = o.billingCycle;
  const iu = o.individualUsage;
  return (
    isRecord(bc) &&
    typeof bc.start === "string" &&
    typeof bc.end === "string" &&
    isRecord(iu) &&
    isRecord(iu.plan)
  );
}

/** Current flat shape (2025–2026) from cursor.com/api/usage-summary. */
function isFlatUsageSummary(o: Record<string, unknown>): boolean {
  return (
    typeof o.billingCycleStart === "string" &&
    typeof o.billingCycleEnd === "string" &&
    isRecord(o.individualUsage) &&
    isRecord(o.individualUsage.plan)
  );
}

export function normalizeUsageSummary(
  raw: unknown,
): UsageSummaryResponse | null {
  if (!isRecord(raw)) return null;

  if (isLegacyUsageSummary(raw)) {
    const iu = normalizeIndividualUsage(raw.individualUsage);
    if (!iu) return null;
    const bc = raw.billingCycle as Record<string, unknown>;
    const membership = isRecord(raw.membership) ? raw.membership : {};
    const display = isRecord(raw.displayMessages) ? raw.displayMessages : {};
    return {
      billingCycle: {
        start: String(bc.start),
        end: String(bc.end),
      },
      membership: {
        type: String(membership.type ?? "free"),
        limitType: String(membership.limitType ?? "user"),
        isUnlimited: Boolean(membership.isUnlimited),
      },
      displayMessages: {
        autoModel: String(display.autoModel ?? ""),
        namedModel: String(display.namedModel ?? ""),
      },
      individualUsage: iu,
      teamUsage: isRecord(raw.teamUsage) ? raw.teamUsage : {},
    };
  }

  if (!isFlatUsageSummary(raw)) return null;

  const iu = normalizeIndividualUsage(raw.individualUsage);
  if (!iu) return null;

  return {
    billingCycle: {
      start: String(raw.billingCycleStart),
      end: String(raw.billingCycleEnd),
    },
    membership: {
      type: String(raw.membershipType ?? "free"),
      limitType: String(raw.limitType ?? "user"),
      isUnlimited: Boolean(raw.isUnlimited),
    },
    displayMessages: {
      autoModel: String(raw.autoModelSelectedDisplayMessage ?? ""),
      namedModel: String(raw.namedModelSelectedDisplayMessage ?? ""),
    },
    individualUsage: iu,
    teamUsage: isRecord(raw.teamUsage) ? raw.teamUsage : {},
  };
}

export function normalizeAuthMe(raw: unknown): CursorAuthMeResponse | null {
  if (!isRecord(raw)) return null;

  if (isRecord(raw.user) && typeof raw.user.id === "number") {
    const u = raw.user;
    const ts = isRecord(raw.timestamps) ? raw.timestamps : {};
    return {
      user: {
        id: u.id as number,
        sub: String(u.sub ?? ""),
        name: String(u.name ?? ""),
        email: String(u.email ?? ""),
        emailVerified: Boolean(u.emailVerified),
        picture: (u.picture as string | null) ?? null,
      },
      timestamps: {
        createdAt: String(ts.createdAt ?? ""),
        updatedAt: String(ts.updatedAt ?? ""),
      },
    };
  }

  if (typeof raw.id !== "number") return null;

  return {
    user: {
      id: raw.id,
      sub: String(raw.sub ?? ""),
      name: String(raw.name ?? ""),
      email: String(raw.email ?? ""),
      emailVerified: Boolean(raw.email_verified ?? raw.emailVerified),
      picture: (raw.picture as string | null) ?? null,
    },
    timestamps: {
      createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
      updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
    },
  };
}

function isModelUsageEntry(v: unknown): v is CursorModelUsage {
  return (
    isRecord(v) &&
    typeof v.numRequests === "number" &&
    typeof v.numTokens === "number"
  );
}

export function normalizeUsageDetail(
  raw: unknown,
): CursorUsageDetailResponse | null {
  if (!isRecord(raw)) return null;

  if (isRecord(raw.models)) {
    return {
      models: raw.models as Record<string, CursorModelUsage>,
      billing: {
        startOfMonth: String(
          isRecord(raw.billing) ? raw.billing.startOfMonth ?? "" : "",
        ),
      },
    };
  }

  const models: Record<string, CursorModelUsage> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key === "startOfMonth" || key === "billing") continue;
    if (isModelUsageEntry(val)) models[key] = val;
  }

  const startOfMonth =
    typeof raw.startOfMonth === "string"
      ? raw.startOfMonth
      : isRecord(raw.billing)
        ? String(raw.billing.startOfMonth ?? "")
        : "";

  if (!startOfMonth && Object.keys(models).length === 0) return null;

  return { models, billing: { startOfMonth } };
}
