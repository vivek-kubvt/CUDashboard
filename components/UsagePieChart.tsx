"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { ModelUsageSlice } from "@/types/usage";

interface UsagePieChartProps {
  data: ModelUsageSlice[];
}

export function UsagePieChart({ data }: UsagePieChartProps) {
  const total = data.reduce((acc, d) => acc + d.tokens, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Usage Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">
          {total > 0
            ? `${formatNumber(total)} tokens from live Cursor usage events`
            : "No model usage in this billing period yet"}
        </p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "hsl(220 16% 10%)",
                border: "1px solid hsl(220 14% 22%)",
                borderRadius: 12,
                color: "hsl(210 20% 96%)",
              }}
              formatter={(value: number, name) => [
                `${formatNumber(value)} tokens (${((value / total) * 100).toFixed(1)}%)`,
                name as string,
              ]}
            />
            <Pie
              data={data.length ? data : [{ model: "no data", tokens: 1, requests: 0, color: "hsl(220 14% 22%)" }]}
              dataKey="tokens"
              nameKey="model"
              innerRadius={56}
              outerRadius={92}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((slice) => (
                <Cell key={slice.model} fill={slice.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ color: "hsl(220 8% 75%)", fontSize: 12 }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
