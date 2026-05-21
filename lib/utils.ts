import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `YYYY-MM-DD` → short label for chart axes (e.g. "May 22"). */
export function formatChartDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function membershipLabel(t: string): string {
  switch (t) {
    case "pro_plus":
      return "Pro Plus";
    case "pro":
      return "Pro";
    case "business":
      return "Business";
    case "free":
      return "Free";
    default:
      return t.replace(/_/g, " ");
  }
}
