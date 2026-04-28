"use client";

import { useEffect, useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

interface PackData {
  id: string;
  status: string;
  generatedAt: string;
  coverLetter: { text: string; docxUrl?: string | null };
  checklist: { text: string; docxUrl?: string | null };
  summary?: { docxUrl?: string | null };
}

function DownloadButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
    >
      <span>{icon}</span> {label}
    </a>
  );
}

export function Step12Pack({
  onBack,
  onNext,
  draftToken,
}: {
  data: ApplicationData;
  countryName: string;
  onBack: () => void;
  onNext: () => void;
  draftToken?: string | null;
}) {
  const [pack, setPack] = useState<PackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/applications/${draftToken}/pack`)
      .then((r) => r.json())
      .then((d) => { if (d.pack) setPack(d.pack); else setError("Could not prepare visa pack"); })
      .catch(() => setError("Could not prepare visa pack"))
      .finally(() => setLoading(false));
  }, [draftToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const checklistDocxUrl = pack?.checklist.docxUrl ?? null;
  const summaryDocxUrl = pack?.summary?.docxUrl ?? null;

  return (
    <>
      <TipBox icon="📎">
        Submit your documents in the order shown in the checklist — consulates process ordered packets faster.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 10 of 13</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Download your visa pack.
      </h1>
      <p className="mt-2 text-slate-600">
        This stage is download-only: application form, checklist, and one ZIP with all uploaded documents.
      </p>

      {pack && (
        <div className="mt-8">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <span>✓</span> Pack ready for download
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summaryDocxUrl && <DownloadButton href={summaryDocxUrl} label="Visa Application Form (.docx)" icon="📋" />}
            {checklistDocxUrl && <DownloadButton href={checklistDocxUrl} label="Checklist (.docx)" icon="✅" />}
            {draftToken && (
              <DownloadButton
                href={`/api/applications/${draftToken}/pack/bundle`}
                label="Full Folder (Application + Documents).zip"
                icon="🗂️"
              />
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <StepFooter step={10} total={13} onBack={onBack} onNext={onNext} nextLabel="Continue to appointment tracking" />
    </>
  );
}
