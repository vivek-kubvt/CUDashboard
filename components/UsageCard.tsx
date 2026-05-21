import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UsageCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const TONES: Record<NonNullable<UsageCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-[hsl(var(--success))]",
  warning: "text-[hsl(var(--warning))]",
  danger: "text-[hsl(var(--danger))]",
};

export function UsageCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
  className,
}: UsageCardProps) {
  return (
    <Card className={cn("p-0", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{label}</CardTitle>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
            TONES[tone],
          )}
        >
          {value}
        </div>
        {sub ? (
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
