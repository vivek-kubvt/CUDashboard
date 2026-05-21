"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Cpu,
  Gauge,
  Gift,
  Mail,
  PiggyBank,
  Zap,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UsageCard } from "@/components/UsageCard";
import { BillingCard } from "@/components/BillingCard";
import { ProgressUsageBar } from "@/components/ProgressUsageBar";
import { UsagePieChart } from "@/components/UsagePieChart";
import { DailyUsageChart } from "@/components/DailyUsageChart";
import { RequestsBarChart } from "@/components/RequestsBarChart";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsage } from "@/hooks/useUsage";
import {
  formatDate,
  formatNumber,
  formatPercent,
  membershipLabel,
} from "@/lib/utils";
import type { DashboardData } from "@/types/usage";
import { downloadDashboardPng } from "@/lib/downloadDashboardPng";

interface DashboardProps {
  initialData?: DashboardData;
}

export function Dashboard({ initialData }: DashboardProps) {
  const { data, error, loading, refresh, lastUpdated } = useUsage({
    initialData,
  });
  const [capturingPng, setCapturingPng] = useState(false);

  const summary = useMemo(() => {
    if (!data) return null;
    const p = data.summary.individualUsage.plan;
    const remaining = Math.max(0, p.breakdown.total - p.used);
    return {
      p,
      remaining,
      includedPct: p.breakdown.total
        ? (p.breakdown.included / p.breakdown.total) * 100
        : 0,
      bonusPct: p.breakdown.total
        ? (p.breakdown.bonus / p.breakdown.total) * 100
        : 0,
    };
  }, [data]);

  const onExportJson = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cursor-usage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const onDownloadPng = useCallback(async () => {
    if (!data || capturingPng) return;
    setCapturingPng(true);
    try {
      await downloadDashboardPng();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save dashboard PNG.";
      window.alert(message);
    } finally {
      setCapturingPng(false);
    }
  }, [data, capturingPng]);

  return (
    <main
      id="dashboard-root"
      className="container mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10"
    >
      <Header
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={() => void refresh()}
        onExportJson={onExportJson}
        onDownloadPng={() => void onDownloadPng()}
        pngLoading={capturingPng}
        pngDisabled={!data}
        userName={data?.user?.name}
        userEmail={data?.user?.email}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div data-dashboard-ready className="space-y-6">
          <section
            aria-label="Usage summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <UsageCard
              label="Total Usage"
              value={formatPercent(summary!.p.usagePercentages.total, 1)}
              sub={`${formatNumber(summary!.p.used)} of ${formatNumber(summary!.p.breakdown.total)} tokens`}
              icon={<Gauge className="h-4 w-4" />}
              tone={
                summary!.p.usagePercentages.total >= 90
                  ? "danger"
                  : summary!.p.usagePercentages.total >= 70
                    ? "warning"
                    : "success"
              }
            />
            <UsageCard
              label="Included Tokens"
              value={formatNumber(summary!.p.breakdown.included)}
              sub={`${summary!.includedPct.toFixed(0)}% of allotment`}
              icon={<Zap className="h-4 w-4" />}
            />
            <UsageCard
              label="Bonus Tokens"
              value={formatNumber(summary!.p.breakdown.bonus)}
              sub={`${summary!.bonusPct.toFixed(0)}% of allotment`}
              icon={<Gift className="h-4 w-4" />}
            />
            <UsageCard
              label="Remaining Tokens"
              value={formatNumber(summary!.remaining)}
              sub={`${membershipLabel(data.summary.membership.type)} plan`}
              icon={<PiggyBank className="h-4 w-4" />}
              tone="success"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Usage Breakdown
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {data.summary.displayMessages.autoModel} ·{" "}
                  {data.summary.displayMessages.namedModel}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <ProgressUsageBar
                  label="Total Usage"
                  percent={summary!.p.usagePercentages.total}
                  sublabel={`${formatNumber(summary!.p.used)} of ${formatNumber(summary!.p.breakdown.total)} tokens used`}
                  tone="green"
                />
                <ProgressUsageBar
                  label="API Usage"
                  percent={summary!.p.usagePercentages.api}
                  sublabel="Direct API / named-model calls"
                  tone="blue"
                />
                <ProgressUsageBar
                  label="Auto Model Usage"
                  percent={summary!.p.usagePercentages.autoModel}
                  sublabel="Auto-routed model traffic"
                  tone="purple"
                />
              </CardContent>
            </Card>

            <BillingCard
              start={data.summary.billingCycle.start}
              end={data.summary.billingCycle.end}
              membershipType={data.summary.membership.type}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DailyUsageChart
              data={data.daily}
              eventsCount={data.usageEventsCount}
            />
            <RequestsBarChart
              data={data.daily}
              eventsCount={data.usageEventsCount}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UsagePieChart data={data.models} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Plan Composition
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Included vs bonus token allotment
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressUsageBar
                  label="Included"
                  percent={summary!.includedPct}
                  sublabel={`${formatNumber(summary!.p.breakdown.included)} tokens`}
                  tone="green"
                />
                <ProgressUsageBar
                  label="Bonus"
                  percent={summary!.bonusPct}
                  sublabel={`${formatNumber(summary!.p.breakdown.bonus)} tokens`}
                  tone="amber"
                />
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>
                    <p>Cycle Start</p>
                    <p className="text-foreground">
                      {formatDate(data.summary.billingCycle.start)}
                    </p>
                  </div>
                  <div>
                    <p>Cycle End</p>
                    <p className="text-foreground">
                      {formatDate(data.summary.billingCycle.end)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Footer />
        </div>
      )}
    </main>
  );
}
