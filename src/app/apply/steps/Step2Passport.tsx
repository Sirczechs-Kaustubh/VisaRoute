"use client";

import { useRef, useState } from "react";
import type { ApplicationData, UploadedDocument } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

function UploadZone({
  label,
  sublabel,
  uploaded,
  isUploading,
  error,
  onUpload,
  onRemove,
}: {
  label: string;
  sublabel: string;
  uploaded: UploadedDocument | undefined;
  isUploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
          uploaded ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 bg-white hover:border-primary-300 hover:bg-primary-50/30"
        } ${isUploading ? "cursor-wait opacity-60" : ""}`}
      >
        {isUploading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Uploading & extracting...</p>
          </>
        ) : uploaded ? (
          <>
            <span className="text-3xl text-emerald-600">✓</span>
            <p className="mt-1 font-semibold text-emerald-800">{uploaded.originalFileName}</p>
            <p className="mt-0.5 text-xs text-emerald-600">Click to replace</p>
          </>
        ) : (
          <>
            <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm font-semibold text-slate-700">{sublabel}</p>
            <p className="mt-0.5 text-xs text-slate-500">JPG, PNG or PDF</p>
          </>
        )}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {uploaded && !isUploading && (
        <button type="button" onClick={onRemove} className="mt-1 text-xs text-slate-500 hover:text-red-600">
          Remove
        </button>
      )}
    </div>
  );
}

interface ExtractedField {
  label: string;
  key: string;
  value: string | null;
}

function ExtractionPreview({
  extraction,
  onApply,
}: {
  extraction: { data: Record<string, string | null>; confidence: number };
  onApply: (data: Record<string, string | null>) => void;
}) {
  const fields: ExtractedField[] = [
    { label: "First name", key: "firstName", value: extraction.data.firstName },
    { label: "Last name", key: "lastName", value: extraction.data.lastName },
    { label: "Passport number", key: "passportNumber", value: extraction.data.passportNumber },
    { label: "Nationality", key: "nationality", value: extraction.data.nationality },
    { label: "Date of birth", key: "dateOfBirth", value: extraction.data.dateOfBirth },
    { label: "Sex", key: "sex", value: extraction.data.sex },
    { label: "Expiry date", key: "expiryDate", value: extraction.data.expiryDate },
    { label: "Issuing country", key: "issuingCountry", value: extraction.data.issuingCountry },
  ];

  const extractedCount = fields.filter((f) => f.value).length;

  if (extractedCount === 0) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Could not extract passport data automatically. Please ensure the photo page is clear and try again, or continue and fill details manually.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-800">Extracted passport data</h3>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {extractedCount}/8 fields
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <div key={field.key} className="text-sm">
            <span className="text-slate-500">{field.label}: </span>
            <span className={field.value ? "font-medium text-slate-900" : "text-slate-400"}>
              {field.value ?? "—"}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onApply(extraction.data)}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Apply to my application
      </button>
    </div>
  );
}

export function Step2Passport({
  data,
  updateData,
  countryName,
  onNext,
  onBack,
  uploadDocument,
  deleteDocument,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  onNext: () => void;
  onBack: () => void;
  uploadDocument: (file: File, documentType: string) => Promise<UploadedDocument | null>;
  deleteDocument: (docId: string) => Promise<void>;
}) {
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [errorFront, setErrorFront] = useState<string | null>(null);
  const [errorBack, setErrorBack] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<{ data: Record<string, string | null>; confidence: number } | null>(null);

  const frontDoc = data.uploadedDocuments.find((d) => d.documentType === "passport");
  const backDoc = data.uploadedDocuments.find((d) => d.documentType === "passport_back");

  const frontIsPdf = frontDoc?.originalFileName?.toLowerCase().endsWith(".pdf");
  const needsBackPage = frontDoc && !frontIsPdf;

  const handleUploadFront = async (file: File) => {
    setUploadingFront(true);
    setErrorFront(null);
    setExtraction(null);
    const result = await uploadDocument(file, "passport");
    if (!result) {
      setErrorFront("Upload failed. Please try again.");
    } else {
      updateData({ passportFile: { file, name: file.name } });
      if (result.extraction) {
        setExtraction({ data: result.extraction.data, confidence: result.extraction.confidence });
      }
    }
    setUploadingFront(false);
  };

  const handleUploadBack = async (file: File) => {
    setUploadingBack(true);
    setErrorBack(null);
    const result = await uploadDocument(file, "passport_back");
    if (!result) setErrorBack("Upload failed. Please try again.");
    setUploadingBack(false);
  };

  const handleRemoveFront = async () => {
    if (frontDoc) await deleteDocument(frontDoc.id);
    if (backDoc) await deleteDocument(backDoc.id);
    updateData({ passportFile: null });
    setExtraction(null);
  };

  const handleRemoveBack = async () => {
    if (backDoc) await deleteDocument(backDoc.id);
  };

  const handleApplyExtraction = (extractedData: Record<string, string | null>) => {
    const updates: Partial<ApplicationData> = {};
    if (extractedData.firstName) updates.firstName = extractedData.firstName;
    if (extractedData.lastName) updates.lastName = extractedData.lastName;
    updateData(updates);
  };

  return (
    <>
      <TipBox icon="📄">
        Ensure your passport is valid for at least 3 months beyond your return date. Expired passports are the #1 rejection reason.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 2 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Upload your passport.
      </h1>
      <p className="mt-2 text-slate-600">
        We&apos;ll extract key fields automatically — no manual typing required.
      </p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
        <p className="text-sm text-amber-800">
          <strong>PDF:</strong> Upload a single file with both pages. <strong>Image (JPG/PNG):</strong> Upload front and back separately.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <UploadZone
          label={frontDoc && !frontIsPdf ? "Front page (photo page)" : "Passport (photo page)"}
          sublabel="Upload passport photo page"
          uploaded={frontDoc}
          isUploading={uploadingFront}
          error={errorFront}
          onUpload={handleUploadFront}
          onRemove={handleRemoveFront}
        />

        {needsBackPage && (
          <UploadZone
            label="Back page"
            sublabel="Upload passport back page"
            uploaded={backDoc}
            isUploading={uploadingBack}
            error={errorBack}
            onUpload={handleUploadBack}
            onRemove={handleRemoveBack}
          />
        )}

        {frontIsPdf && (
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <span>✓</span> PDF uploaded — both pages included. No back page needed.
            </p>
          </div>
        )}
      </div>

      {extraction && (
        <ExtractionPreview extraction={extraction} onApply={handleApplyExtraction} />
      )}

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
        <span className="text-primary-600">🔒</span>
        <p className="text-sm text-slate-700">
          Documents stored securely and encrypted at rest.
        </p>
      </div>

      <StepFooter step={2} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
