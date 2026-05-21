"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { eventTokens } from "@/lib/usageEvents";
import type { CursorUsageEvent } from "@/types/usage";

interface RecentUsageEventsProps {
  events: CursorUsageEvent[];
  totalCount: number;
}

function formatEventTime(timestamp: string): string {
  const ms = Number(timestamp);
  if (!Number.isFinite(ms)) return timestamp;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCents(cents?: number): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export function RecentUsageEvents({ events, totalCount }: RecentUsageEventsProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent usage activity</CardTitle>
          <p className="text-xs text-muted-foreground">
            Live data from Cursor get-filtered-usage-events
          </p>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No usage events in this billing period.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent usage activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          {totalCount.toLocaleString()} events in cycle · showing newest{" "}
          {events.length} from Cursor API
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Time</th>
              <th className="pb-2 pr-3 font-medium">Model</th>
              <th className="pb-2 pr-3 font-medium text-right">Tokens</th>
              <th className="pb-2 pr-3 font-medium text-right">Req. cost</th>
              <th className="pb-2 font-medium text-right">Charged</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <tr
                key={`${event.timestamp}-${i}`}
                className="border-b border-border/50 text-foreground"
              >
                <td className="py-2 pr-3 whitespace-nowrap">
                  {formatEventTime(event.timestamp)}
                </td>
                <td className="py-2 pr-3 max-w-[200px] truncate" title={event.model}>
                  {event.model}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatNumber(eventTokens(event))}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {event.requestsCosts != null
                    ? event.requestsCosts.toFixed(1)
                    : "—"}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCents(event.chargedCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
