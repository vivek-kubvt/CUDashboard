"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChartDay, formatNumber } from "@/lib/utils";
import type { DailyUsagePoint } from "@/types/usage";

interface RequestsBarChartProps {
  data: DailyUsagePoint[];
}

export function RequestsBarChart({ data }: RequestsBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests Over Time</CardTitle>
        <p className="text-xs text-muted-foreground">
          Estimated requests per day through today in this billing cycle
        </p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(199 89% 60%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(199 89% 35%)" stopOpacity={0.4} />
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
              width={32}
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
              formatter={(v: number) => [`${formatNumber(v)} requests`, "Requests"]}
              cursor={{ fill: "hsla(220, 14%, 22%, 0.5)" }}
            />
            <Bar
              dataKey="requests"
              fill="url(#reqGrad)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
