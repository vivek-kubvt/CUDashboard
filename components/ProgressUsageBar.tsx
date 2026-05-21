"use client";

import { useEffect, useState } from "react";
import { cn, formatPercent } from "@/lib/utils";

interface ProgressUsageBarProps {
  label: string;
  percent: number;
  sublabel?: string;
  tone?: "green" | "blue" | "purple" | "amber";
  className?: string;
}

const TONES: Record<NonNullable<ProgressUsageBarProps["tone"]>, string> = {
  green:
    "from-[hsl(160_84%_45%)] via-[hsl(160_84%_50%)] to-[hsl(180_84%_55%)]",
  blue: "from-[hsl(199_89%_55%)] via-[hsl(210_89%_60%)] to-[hsl(230_89%_65%)]",
  purple:
    "from-[hsl(265_80%_60%)] via-[hsl(280_80%_65%)] to-[hsl(300_80%_70%)]",
  amber:
    "from-[hsl(35_92%_55%)] via-[hsl(25_92%_55%)] to-[hsl(15_92%_55%)]",
};

export function ProgressUsageBar({
  label,
  percent,
  sublabel,
  tone = "green",
  className,
}: ProgressUsageBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setWidth(clamped));
    return () => window.cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatPercent(clamped, 1)}
        </span>
      </div>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/70"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-1000 ease-out",
            TONES[tone],
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {sublabel ? (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
