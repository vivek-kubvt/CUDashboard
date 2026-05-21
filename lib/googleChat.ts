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

/** Card with only the dashboard PNG — no title, stats, or plain-text body. */
export function buildScreenshotCard(
  screenshotUrl: string,
): GoogleChatCardMessage {
  return {
    cardsV2: [
      {
        cardId: `cursor-dashboard-${Date.now()}`,
        card: {
          sections: [
            {
              widgets: [
                {
                  image: {
                    imageUrl: screenshotUrl,
                    altText: "Cursor usage dashboard",
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

export async function sendDashboardScreenshot(
  screenshotUrl: string,
): Promise<void> {
  await sendGoogleChatMessage(buildScreenshotCard(screenshotUrl));
}
