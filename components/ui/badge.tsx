import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const variants: Record<string, string> = {
    default: "bg-secondary text-foreground",
    success: "bg-success/15 text-[hsl(var(--success))] border border-success/30",
    warning: "bg-warning/15 text-[hsl(var(--warning))] border border-warning/30",
    danger: "bg-danger/15 text-[hsl(var(--danger))] border border-danger/30",
    muted: "bg-secondary/60 text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
