"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChartDay, formatNumber } from "@/lib/utils";
import type { DailyUsagePoint } from "@/types/usage";

interface DailyUsageChartProps {
  data: DailyUsagePoint[];
  eventsCount?: number;
}

export function DailyUsageChart({ data, eventsCount = 0 }: DailyUsageChartProps) {
  const hasUsage = data.some((d) => d.tokens > 0);
  const totalTokens = data.reduce((s, d) => s + d.tokens, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Token Usage</CardTitle>
        <p className="text-xs text-muted-foreground">
          {hasUsage
            ? `Live data from ${eventsCount.toLocaleString()} Cursor usage events · ${totalTokens.toLocaleString()} tokens in cycle`
            : "No usage events recorded in this billing period yet"}
        </p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="dailyTokens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160 84% 50%)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="hsl(160 84% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(220 14% 18%)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(220 14% 22%)" }}
              tickLine={false}
              minTickGap={20}
              tickFormatter={formatChartDay}
            />
            <YAxis
              tick={{ fill: "hsl(220 8% 65%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(220 14% 22%)" }}
              tickLine={false}
              width={42}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220 16% 10%)",
                border: "1px solid hsl(220 14% 22%)",
                borderRadius: 12,
                color: "hsl(210 20% 96%)",
              }}
              labelStyle={{ color: "hsl(220 8% 75%)" }}
              labelFormatter={formatChartDay}
              formatter={(v: number) => [`${formatNumber(v)} tokens`, "Tokens"]}
            />
            <Area
              type="monotone"
              dataKey="tokens"
              stroke="hsl(160 84% 55%)"
              strokeWidth={2.2}
              fill="url(#dailyTokens)"
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
