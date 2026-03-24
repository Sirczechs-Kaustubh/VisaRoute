"use client";

import { useRef, useState } from "react";
import type { ApplicationData, UploadedDocument } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const RESIDENCE_DOC_TYPES = [
  { value: "brp", label: "Biometric Residence Permit (BRP)", desc: "Physical card issued by the Home Office" },
  { value: "visa_vignette", label: "Visa Vignette", desc: "Visa sticker in your passport" },
  { value: "evisa", label: "eVisa", desc: "Digital immigration status" },
  { value: "residence_permit", label: "Other Residence Permit", desc: "Non-UK residence document" },
];

function SharecodeVerifier({ draftToken }: { draftToken: string | null }) {
  const [shareCode, setShareCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; status: string; message: string } | null>(null);

  const handleVerify = async () => {
    if (!draftToken || !shareCode || !dateOfBirth) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch(`/api/applications/${draftToken}/sharecode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode, dateOfBirth }),
      });
      const data = await response.json();
      if (data.verification) {
        setResult(data.verification);
      } else {
        setResult({ valid: false, status: "error", message: data.error?.message ?? "Verification failed" });
      }
    } catch {
      setResult({ valid: false, status: "error", message: "Could not verify share code" });
    }

    setIsVerifying(false);
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <h3 className="text-sm font-semibold text-violet-800">Verify via Share Code (optional)</h3>
      <p className="mt-1 text-xs text-violet-600">
        If you have a UK Home Office share code, enter it here to verify your immigration status digitally.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600">Share code</label>
          <input
            type="text"
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value.toUpperCase())}
            placeholder="e.g. W1234567A"
            maxLength={9}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">Date of birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={isVerifying || !shareCode || !dateOfBirth}
        className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isVerifying ? "Verifying..." : "Verify share code"}
      </button>

      {result && (
        <div className={`mt-3 rounded-lg p-3 text-sm ${
          result.valid ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
        }`}>
          {result.valid ? "✓" : "✗"} {result.message}
        </div>
      )}
    </div>
  );
}

export function Step3Residence({
  data,
  updateData,
  countryName,
  onNext,
  onBack,
  uploadDocument,
  deleteDocument,
  draftToken,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  onNext: () => void;
  onBack: () => void;
  uploadDocument: (file: File, documentType: string) => Promise<UploadedDocument | null>;
  deleteDocument: (docId: string) => Promise<void>;
  draftToken?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState("brp");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const residenceDocTypes = RESIDENCE_DOC_TYPES.map((t) => t.value);
  const uploadedResidenceDocs = data.uploadedDocuments.filter((d) => residenceDocTypes.includes(d.documentType));
  const isUK = data.applyingFromCountry === "gb" || data.countryOfResidence === "gb";

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const result = await uploadDocument(file, selectedDocType);
    if (result) {
      updateData({ residenceFile: { file, name: file.name } });
    } else {
      setUploadError("Upload failed. Please try again.");
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (docId: string) => {
    await deleteDocument(docId);
    if (uploadedResidenceDocs.length <= 1) {
      updateData({ residenceFile: null });
    }
  };

  return (
    <>
      <TipBox icon="🏠">
        Your residence permit must not expire before your planned travel date.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 3 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Confirm your residence status.
      </h1>
      <p className="mt-2 text-slate-600">
        {isUK
          ? "As a UK-based applicant, we need to verify your residence permit eligibility."
          : "We need to verify your current residence status."}
      </p>

      {isUK && (
        <div className="mt-6">
          <SharecodeVerifier draftToken={draftToken ?? null} />
        </div>
      )}

      <div className="mt-6">
        <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
          <p className="text-sm text-slate-700">
            Upload your residence document so we can verify your eligibility and extract key details automatically.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Document type</label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {RESIDENCE_DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-slate-500">
            {RESIDENCE_DOC_TYPES.find((t) => t.value === selectedDocType)?.desc}
          </p>
        </div>

        <div className="mt-4">
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition ${
              isUploading ? "cursor-wait opacity-60 border-slate-300" : "border-slate-300 bg-white hover:border-primary-300 hover:bg-primary-50/30"
            }`}
          >
            {isUploading ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Uploading...</p>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-700">Upload your {RESIDENCE_DOC_TYPES.find((t) => t.value === selectedDocType)?.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">JPG, PNG or PDF</p>
              </>
            )}
          </button>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>

        {uploadedResidenceDocs.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Uploaded documents</h3>
            {uploadedResidenceDocs.map((doc) => {
              const typeLabel = RESIDENCE_DOC_TYPES.find((t) => t.value === doc.documentType)?.label ?? doc.documentType;
              return (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <div>
                      <p className="text-sm font-medium text-emerald-800">{doc.originalFileName}</p>
                      <p className="text-xs text-emerald-600">{typeLabel}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemove(doc.id)} className="text-sm text-slate-500 hover:text-red-600">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StepFooter step={3} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
