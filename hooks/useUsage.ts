"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData } from "@/types/usage";

interface UseUsageOptions {
  refreshIntervalMs?: number;
  initialData?: DashboardData;
}

interface UseUsageResult {
  data: DashboardData | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

const DEFAULT_INTERVAL = 5 * 60 * 1000;

export function useUsage(options: UseUsageOptions = {}): UseUsageResult {
  const { refreshIntervalMs = DEFAULT_INTERVAL, initialData } = options;
  const [data, setData] = useState<DashboardData | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialData ? new Date(initialData.fetchedAt) : null,
  );
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/usage", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) void refresh();
    const id = window.setInterval(() => void refresh(), refreshIntervalMs);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [refresh, refreshIntervalMs, initialData]);

  return { data, error, loading, refresh, lastUpdated };
}
