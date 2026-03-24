"use client";

import { useRef, useState } from "react";
import type { ApplicationData, UploadedDocument } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const DOCUMENT_TYPES = [
  { id: "passport", label: "Passport (front)", desc: "Photo page – valid 3+ months after travel", icon: "🛂", autoCaptured: true, altTypes: ["passport_back"] },
  { id: "brp", label: "Residence permit", desc: "BRP, visa vignette or eVisa", icon: "🏠", autoCaptured: true, altTypes: ["residence_permit", "visa_vignette", "evisa"] },
  { id: "bank_statement", label: "Bank statements", desc: "Last 3 months – min. €50-100/day of travel", icon: "🏦", autoCaptured: false },
  { id: "travel_insurance", label: "Travel insurance", desc: "Min. €30,000 coverage across all Schengen", icon: "🛡️", autoCaptured: false },
  { id: "flight_booking", label: "Flight reservation", desc: "Confirmed or dummy booking", icon: "✈️", autoCaptured: false },
  { id: "accommodation_proof", label: "Hotel / accommodation", desc: "Booking for all nights of stay", icon: "🛏️", autoCaptured: false },
  { id: "employment_letter", label: "Employment letter", desc: "Signed by employer", icon: "📄", autoCaptured: false },
];

export function Step9Documents({
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
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const isDocUploaded = (docId: string, altTypes?: string[]) => {
    const typesToCheck = [docId, ...(altTypes ?? [])];
    return data.uploadedDocuments.some((d) => typesToCheck.includes(d.documentType));
  };

  const getUploadedDoc = (docId: string, altTypes?: string[]) => {
    const typesToCheck = [docId, ...(altTypes ?? [])];
    return data.uploadedDocuments.find((d) => typesToCheck.includes(d.documentType));
  };

  const completedCount = DOCUMENT_TYPES.filter((doc) => isDocUploaded(doc.id, doc.autoCaptured ? (doc as { altTypes?: string[] }).altTypes : undefined)).length;

  const handleUpload = async (docTypeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(docTypeId);
    await uploadDocument(file, docTypeId);
    setUploadingId(null);

    if (refs.current[docTypeId]) {
      refs.current[docTypeId]!.value = "";
    }
  };

  const handleRemove = async (docId: string, docTypeId: string) => {
    await deleteDocument(docId);
  };

  return (
    <>
      <TipBox icon="📄">
        Upload clear, colour scans. Blurry or black-and-white documents are a common reason for delays.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 7 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Upload your supporting documents.
      </h1>
      <p className="mt-2 text-slate-600">
        Smart checklist generated from your profile – only what you actually need.
      </p>

      <div className="mt-6 rounded-xl bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <span>✓</span> {completedCount} / {DOCUMENT_TYPES.length} documents uploaded
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Your personalised checklist</h2>
        <div className="mt-4 space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const altTypes = (doc as { altTypes?: string[] }).altTypes;
            const uploaded = isDocUploaded(doc.id, altTypes);
            const uploadedDoc = getUploadedDoc(doc.id, altTypes);
            const isThisUploading = uploadingId === doc.id;

            return (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{doc.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{doc.label}</p>
                    <p className="text-sm text-slate-500">{doc.desc}</p>
                  </div>
                  {uploaded && doc.autoCaptured && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Auto-captured</span>
                  )}
                </div>
                <div>
                  {isThisUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                      <span className="text-sm text-slate-500">Uploading...</span>
                    </div>
                  ) : uploaded && uploadedDoc ? (
                    <div className="flex items-center gap-2">
                      <span className="max-w-[120px] truncate text-sm font-medium text-emerald-700">{uploadedDoc.originalFileName}</span>
                      {!doc.autoCaptured && (
                        <button onClick={() => handleRemove(uploadedDoc.id, doc.id)} className="text-sm text-slate-500 hover:text-red-600">Remove</button>
                      )}
                    </div>
                  ) : doc.autoCaptured ? (
                    <span className="text-sm text-amber-600">Not yet uploaded</span>
                  ) : (
                    <>
                      <input ref={(el) => { refs.current[doc.id] = el; }} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleUpload(doc.id, e)} className="hidden" />
                      <button onClick={() => refs.current[doc.id]?.click()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ Upload</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-amber-50 p-4">
        <p className="flex items-start gap-2 text-sm text-amber-800">
          <span>!</span> After upload, our system validates each document for completeness and minimum requirements.
        </p>
      </div>

      <StepFooter step={7} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
