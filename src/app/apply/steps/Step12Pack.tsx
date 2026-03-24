"use client";

import { useEffect, useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

interface PackData {
  id: string;
  status: string;
  generatedAt: string;
  generationMethod?: "ai" | "template";
  coverLetter: { text: string; docxUrl?: string | null; txtUrl?: string | null; url?: string | null };
  checklist: { text: string; docxUrl?: string | null; url?: string | null };
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
  const [pack, setPack] = useState<PackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cover" | "checklist">("cover");

  useEffect(() => {
    if (!draftToken) { setLoading(false); return; }
    fetch(`/api/applications/${draftToken}/pack`)
      .then((r) => r.json())
      .then((d) => { if (d.pack) setPack(d.pack); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [draftToken]);

  async function handleGenerate() {
    if (!draftToken) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${draftToken}/pack`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to generate pack");
        return;
      }
      setPack(body.pack);
    } catch {
      setError("Failed to generate pack");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const coverDocxUrl = pack?.coverLetter.docxUrl ?? null;
  const checklistDocxUrl = pack?.checklist.docxUrl ?? null;
  const summaryDocxUrl = pack?.summary?.docxUrl ?? null;

  return (
    <>
      <TipBox icon="📎">
        Submit your documents in the order shown in the checklist — consulates process ordered packets faster.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 10 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Generate your visa application pack.
      </h1>
      <p className="mt-2 text-slate-600">
        We&apos;ll produce a complete, ready-to-submit document pack as editable Word files.
      </p>

      {!pack && (
        <>
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">What will be generated</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: "✉️", label: "Cover letter", desc: "AI-personalised, editable .docx" },
                { icon: "✅", label: "Document checklist", desc: "Status of all uploads" },
                { icon: "📋", label: "Application summary", desc: "Full details overview" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
              <p className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-primary-600">!</span>
                Your cover letter references prior Schengen visits and addresses any refusal history — increasing approval probability.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {generating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <span>✨</span> Generate my visa pack
              </>
            )}
          </button>
        </>
      )}

      {pack && (
        <div className="mt-8">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <span>✓</span> Pack generated
              {pack.generationMethod === "ai" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">AI-personalised</span>
              )}
            </p>
          </div>

          {/* Download buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            {coverDocxUrl && <DownloadButton href={coverDocxUrl} label="Cover Letter (.docx)" icon="✉️" />}
            {checklistDocxUrl && <DownloadButton href={checklistDocxUrl} label="Checklist (.docx)" icon="✅" />}
            {summaryDocxUrl && <DownloadButton href={summaryDocxUrl} label="Summary (.docx)" icon="📋" />}
          </div>

          {/* Tabs for text preview */}
          <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("cover")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "cover" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cover Letter
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "checklist" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Checklist
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
              {activeTab === "cover" ? pack.coverLetter.text : pack.checklist.text}
            </pre>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {generating ? "Regenerating..." : "↻ Regenerate pack"}
          </button>
        </div>
      )}

      <StepFooter step={10} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
