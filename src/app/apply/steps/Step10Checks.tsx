"use client";

import { useEffect, useState, useCallback } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

interface CheckItem {
  checkCode: string;
  status: "pass" | "warn" | "fail";
  title: string;
  detail: string | null;
  subDetail: string | null;
  severity: string;
}

interface ChecksResult {
  runId: string | null;
  summary: { total: number; passed: number; warnings: number; failed: number };
  checks: CheckItem[];
}

const STATUS_ICON: Record<string, string> = {
  pass: "✓",
  warn: "▲",
  fail: "✗",
};

const STATUS_COLORS: Record<string, { border: string; bg: string; badge: string; badgeText: string; bar: string }> = {
  pass: { border: "border-emerald-200", bg: "bg-emerald-50/50", badge: "bg-emerald-100", badgeText: "text-emerald-700", bar: "bg-emerald-400" },
  warn: { border: "border-amber-200", bg: "bg-amber-50/50", badge: "bg-amber-100", badgeText: "text-amber-700", bar: "bg-amber-400" },
  fail: { border: "border-red-200", bg: "bg-red-50/50", badge: "bg-red-100", badgeText: "text-red-700", bar: "bg-red-400" },
};

export function Step10Checks({
  data,
  countryName,
  onNext,
  onBack,
  draftToken,
}: {
  data: ApplicationData;
  countryName: string;
  onNext: () => void;
  onBack: () => void;
  draftToken?: string | null;
}) {
  const [result, setResult] = useState<ChecksResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    if (!draftToken) return;
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${draftToken}/checks`, { method: "POST" });
      if (!response.ok) throw new Error("Check run failed");
      const data = await response.json();
      setResult(data);
    } catch {
      setError("Could not run checks. Please try again.");
    }
    setIsRunning(false);
  }, [draftToken]);

  // Load existing checks on mount
  useEffect(() => {
    if (!draftToken) return;
    fetch(`/api/applications/${draftToken}/checks`)
      .then((r) => r.json())
      .then((data) => {
        if (data.checks?.length > 0) setResult(data);
      })
      .catch(() => {});
  }, [draftToken]);

  return (
    <>
      <TipBox icon="🔍">
        Our checks flag issues before the embassy sees them — fixing them now saves weeks of delays.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 8 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Automated document checks.
      </h1>
      <p className="mt-2 text-slate-600">
        Our system analyses your application and documents for completeness and minimum requirements.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={runChecks}
          disabled={isRunning || !draftToken}
          className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running checks...
            </span>
          ) : result ? "Re-run checks" : "Run checks"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{result.summary.passed}</p>
              <p className="text-xs font-medium text-emerald-600">Passed</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{result.summary.warnings}</p>
              <p className="text-xs font-medium text-amber-600">Warnings</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{result.summary.failed}</p>
              <p className="text-xs font-medium text-red-600">Failed</p>
            </div>
          </div>

          {result.summary.failed > 0 && (
            <div className="mt-4 rounded-xl bg-red-100 p-4">
              <p className="flex items-center gap-2 font-medium text-red-800">
                <span>✗</span> {result.summary.failed} issue{result.summary.failed > 1 ? "s" : ""} found — fix before submitting.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {result.checks.map((check) => {
              const colors = STATUS_COLORS[check.status] ?? STATUS_COLORS.fail;
              return (
                <div key={check.checkCode} className={`overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg}`}>
                  <div className="flex items-start justify-between p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{check.title}</p>
                      {check.detail && <p className="mt-1 text-sm text-slate-600">{check.detail}</p>}
                      {check.subDetail && <p className="mt-0.5 text-xs text-slate-500">{check.subDetail}</p>}
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${colors.badge} ${colors.badgeText}`}>
                      {STATUS_ICON[check.status]} {check.status === "pass" ? "Pass" : check.status === "warn" ? "Warning" : "Failed"}
                    </span>
                  </div>
                  <div className={`h-1 ${colors.bar}`} style={{ width: check.status === "pass" ? "100%" : check.status === "warn" ? "66%" : "33%" }} />
                </div>
              );
            })}
          </div>
        </>
      )}

      <StepFooter step={8} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
