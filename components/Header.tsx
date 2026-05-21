"use client";

import { RefreshCw, Download, FileImage, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
  onExportJson: () => void;
  onDownloadPng: () => void;
  pngLoading?: boolean;
  pngDisabled?: boolean;
  userName?: string;
  userEmail?: string;
}

export function Header({
  lastUpdated,
  loading,
  onRefresh,
  onExportJson,
  onDownloadPng,
  pngLoading = false,
  pngDisabled = false,
  userName,
  userEmail,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground shadow-md">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Cursor Usage Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            {userName ? (
              <>
                <span className="text-foreground">{userName}</span>
                {userEmail ? ` · ${userEmail}` : ""}
                {" · "}
              </>
            ) : null}
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Awaiting first sync"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" className="hidden sm:inline-flex">
          Live
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportJson}
          aria-label="Export usage as JSON"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export JSON</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPng}
          disabled={pngDisabled || pngLoading}
          aria-label="Download dashboard as PNG"
        >
          <FileImage
            className={`h-4 w-4 ${pngLoading ? "animate-pulse" : ""}`}
          />
          <span className="hidden sm:inline">
            {pngLoading ? "Capturing…" : "PNG"}
          </span>
        </Button>
        <Button
          variant="gradient"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </header>
  );
}
