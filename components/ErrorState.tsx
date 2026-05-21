"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-danger/15 p-3 text-[hsl(var(--danger))]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold">Couldn’t load usage data</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="gradient" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-base font-semibold">No usage yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Once your usage endpoint returns data, it will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
