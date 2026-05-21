import type { UsageSummaryResponse, CursorUser } from "@/types/usage";
import {
  formatDate,
  formatNumber,
  formatPercent,
  membershipLabel,
} from "@/lib/utils";

export interface GoogleChatTextMessage {
  text: string;
}

export interface GoogleChatCardMessage {
  cardsV2: Array<{
    cardId: string;
    card: {
      header?: {
        title: string;
        subtitle?: string;
        imageUrl?: string;
        imageType?: "CIRCLE" | "SQUARE";
      };
      sections: Array<{
        header?: string;
        widgets: Array<Record<string, unknown>>;
      }>;
    };
  }>;
}

export type GoogleChatPayload =
  | GoogleChatTextMessage
  | GoogleChatCardMessage
  | (GoogleChatTextMessage & Partial<GoogleChatCardMessage>);

function webhookUrl(): string {
  const url = process.env.GOOGLE_CHAT_WEBHOOK?.trim();
  if (!url) {
    throw new Error(
      "GOOGLE_CHAT_WEBHOOK is not set. Add it as a GitHub Actions repository secret.",
    );
  }
  return url;
}

export async function sendGoogleChatMessage(
  payload: GoogleChatPayload,
): Promise<void> {
  const res = await fetch(webhookUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Google Chat webhook responded ${res.status}: ${body.slice(0, 300)}`,
    );
  }
}

export function buildUsageText(
  summary: UsageSummaryResponse,
  user?: CursorUser | null,
): string {
  const p = summary.individualUsage.plan;
  const remaining = Math.max(0, p.breakdown.total - p.used);
  const who = user ? `${user.name} (${user.email})` : "Cursor account";
  return [
    "Cursor Usage Report",
    `For: ${who}`,
    "",
    `Total Usage: ${formatPercent(p.usagePercentages.total, 1)}`,
    `API Usage: ${formatPercent(p.usagePercentages.api, 1)}`,
    `Auto Usage: ${formatPercent(p.usagePercentages.autoModel, 1)}`,
    "",
    `Remaining Tokens: ${formatNumber(remaining)}`,
    `Plan: ${membershipLabel(summary.membership.type)}`,
    `Cycle: ${formatDate(summary.billingCycle.start)} → ${formatDate(summary.billingCycle.end)}`,
    `Generated: ${new Date().toISOString()}`,
  ].join("\n");
}

export function buildUsageCard(
  summary: UsageSummaryResponse,
  user?: CursorUser | null,
  screenshotUrl?: string,
): GoogleChatCardMessage {
  const p = summary.individualUsage.plan;
  const remaining = Math.max(0, p.breakdown.total - p.used);

  const widgets: Array<Record<string, unknown>> = [];

  if (screenshotUrl) {
    widgets.push({
      image: {
        imageUrl: screenshotUrl,
        altText: "Full Cursor usage dashboard",
      },
    });
  }

  if (user) {
    widgets.push({
      decoratedText: {
        topLabel: "Account",
        text: `<b>${user.name}</b>`,
        bottomLabel: user.email,
      },
    });
  }
  widgets.push(
    {
      decoratedText: {
        topLabel: "Total Usage",
        text: `<b>${formatPercent(p.usagePercentages.total, 1)}</b>`,
      },
    },
    {
      decoratedText: {
        topLabel: "API Usage",
        text: `<b>${formatPercent(p.usagePercentages.api, 1)}</b>`,
      },
    },
    {
      decoratedText: {
        topLabel: "Auto Model Usage",
        text: `<b>${formatPercent(p.usagePercentages.autoModel, 1)}</b>`,
      },
    },
    {
      decoratedText: {
        topLabel: "Remaining Tokens",
        text: `<b>${formatNumber(remaining)}</b>`,
        bottomLabel: `${formatNumber(p.breakdown.included)} included + ${formatNumber(p.breakdown.bonus)} bonus`,
      },
    },
    {
      decoratedText: {
        topLabel: "Billing Cycle",
        text: `${formatDate(summary.billingCycle.start)} → ${formatDate(summary.billingCycle.end)}`,
        bottomLabel: `Plan: ${membershipLabel(summary.membership.type)}`,
      },
    },
  );

  return {
    cardsV2: [
      {
        cardId: `cursor-usage-${Date.now()}`,
        card: {
          header: {
            title: "Cursor Usage Report",
            subtitle: new Date().toISOString(),
          },
          sections: [{ widgets }],
        },
      },
    ],
  };
}

export async function sendUsageReport(
  summary: UsageSummaryResponse,
  user?: CursorUser | null,
  screenshotUrl?: string,
): Promise<void> {
  const text = buildUsageText(summary, user);
  const card = buildUsageCard(summary, user, screenshotUrl);
  try {
    await sendGoogleChatMessage({ text, ...card });
  } catch (err) {
    console.warn(
      "[report] Card payload failed, retrying text-only:",
      (err as Error).message,
    );
    await sendGoogleChatMessage({ text });
  }
}
