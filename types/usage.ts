export type MembershipType =
  | "free"
  | "pro"
  | "pro_plus"
  | "business"
  | string;

export interface BillingCycle {
  start: string;
  end: string;
}

export interface Membership {
  type: MembershipType;
  limitType: string;
  isUnlimited: boolean;
}

export interface DisplayMessages {
  autoModel: string;
  namedModel: string;
}

export interface UsagePlanBreakdown {
  included: number;
  bonus: number;
  total: number;
}

export interface UsagePercentages {
  autoModel: number;
  api: number;
  total: number;
}

export interface UsagePlan {
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number;
  breakdown: UsagePlanBreakdown;
  usagePercentages: UsagePercentages;
}

export interface OnDemandUsage {
  enabled: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface IndividualUsage {
  plan: UsagePlan;
  onDemand: OnDemandUsage;
}

export interface UsageSummaryResponse {
  billingCycle: BillingCycle;
  membership: Membership;
  displayMessages: DisplayMessages;
  individualUsage: IndividualUsage;
  teamUsage: Record<string, unknown>;
}

export interface CursorUser {
  id: number;
  sub: string;
  name: string;
  email: string;
  emailVerified: boolean;
  picture: string | null;
}

export interface CursorAuthMeResponse {
  user: CursorUser;
  timestamps: { createdAt: string; updatedAt: string };
}

export interface CursorModelUsage {
  numRequests: number;
  numRequestsTotal: number;
  numTokens: number;
  maxTokenUsage: number | null;
  maxRequestUsage: number | null;
}

export interface CursorUsageDetailResponse {
  models: Record<string, CursorModelUsage>;
  billing: { startOfMonth: string };
}

export interface DailyUsagePoint {
  date: string;
  tokens: number;
  requests: number;
}

export interface ModelUsageSlice {
  model: string;
  tokens: number;
  requests: number;
  color: string;
}

export interface DashboardData {
  summary: UsageSummaryResponse;
  user: CursorUser | null;
  detail: CursorUsageDetailResponse | null;
  daily: DailyUsagePoint[];
  models: ModelUsageSlice[];
  fetchedAt: string;
}
