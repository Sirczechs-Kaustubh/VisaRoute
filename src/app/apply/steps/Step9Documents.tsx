"use client";

import { useRef, useState } from "react";
import type { ApplicationData, UploadedDocument } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";
import { DocumentGeneratorModal, type GeneratorDocType } from "../DocumentGeneratorModal";

interface DocConfig {
  id: string;
  label: string;
  desc: string;
  icon: string;
  altTypes?: string[];
  autoCaptured?: boolean;
  canGenerate?: GeneratorDocType;
}

const MUST_HAVE_DOCS: DocConfig[] = [
  {
    id: "passport",
    label: "Passport",
    desc: "Photo page — auto-captured in Step 2",
    icon: "🛂",
    altTypes: ["passport_back"],
    autoCaptured: true,
  },
  {
    id: "bank_statement",
    label: "Bank statements",
    desc: "Last 3–6 months — personal account",
    icon: "🏦",
  },
];

const SELF_EMPLOYED_DOCS: DocConfig[] = [
  { id: "business_registration", label: "Business registration certificate", desc: "Trade license or company incorporation document", icon: "📋" },
  { id: "tax_returns", label: "Tax returns", desc: "Last 1–2 years (certified copies)", icon: "📊" },
  { id: "business_bank_statement", label: "Business bank statements", desc: "Last 3–6 months", icon: "🏦" },
  { id: "profit_loss", label: "Profit & loss statement", desc: "Certified earnings statement", icon: "📈" },
  { id: "accountant_letter", label: "Accountant / CPA letter", desc: "Confirming self-employment status and income (within 3 months)", icon: "✍️" },
];

const SHOULD_HAVE_DOCS: DocConfig[] = [
  { id: "travel_insurance", label: "Travel insurance", desc: "Min. €30,000 coverage across Schengen", icon: "🛡️" },
  { id: "flight_booking", label: "Flight reservation", desc: "Confirmed or dummy booking", icon: "✈️" },
  { id: "accommodation_proof", label: "Hotel / accommodation", desc: "Booking for all nights of stay", icon: "🛏️" },
];

const GOOD_TO_HAVE_DOCS: DocConfig[] = [
  { id: "cover_letter", label: "Cover letter", desc: "Personalised letter to the embassy", icon: "📝", canGenerate: "cover_letter" },
  { id: "invitation_letter", label: "Invitation letter", desc: "From your host in the destination country", icon: "💌", canGenerate: "invitation_letter" },
  { id: "appointment_letter", label: "Appointment / business letter", desc: "Confirmation from company or hospital", icon: "📄", canGenerate: "appointment_letter" },
  { id: "holiday_letter", label: "Personal travel statement", desc: "Explaining your travel purpose", icon: "🏖️", canGenerate: "holiday_letter" },
];

function ValidationBadge({ validation }: { validation: UploadedDocument["validation"] }) {
  if (!validation || validation.status === "PASSED") return null;
  if (validation.status === "WARNING") {
    return (
      <div className="mt-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          ⚠ Review recommended
        </span>
        {validation.warnings.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {validation.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">• {w}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return null;
}

function DocRow({
  doc,
  uploadedDoc,
  isUploading,
  autoCaptured,
  inputRef,
  onUpload,
  onRemove,
  onGenerate,
}: {
  doc: DocConfig;
  uploadedDoc: UploadedDocument | undefined;
  isUploading: boolean;
  autoCaptured?: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onGenerate?: () => void;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const isUploaded = !!uploadedDoc;
  const hasWarning = uploadedDoc?.validation?.status === "WARNING";

  const combinedRef = (el: HTMLInputElement | null) => {
    localRef.current = el;
    inputRef(el);
  };

  return (
    <div
      className={`flex items-start justify-between rounded-xl border p-4 transition ${
        hasWarning
          ? "border-amber-200 bg-amber-50/20"
          : isUploaded
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 shrink-0 text-2xl">{doc.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{doc.label}</p>
            {isUploaded && autoCaptured && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Auto-captured
              </span>
            )}
            {isUploaded && !autoCaptured && !hasWarning && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{doc.desc}</p>
          {isUploaded && uploadedDoc.originalFileName && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{uploadedDoc.originalFileName}</p>
          )}
          {isUploaded && <ValidationBadge validation={uploadedDoc.validation} />}
        </div>
      </div>

      <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
        {isUploading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            <span className="text-xs text-slate-500">Validating...</span>
          </div>
        ) : autoCaptured && !isUploaded ? (
          <span className="text-xs text-amber-600">Not yet uploaded</span>
        ) : (
          <div className="flex items-center gap-2">
            {!autoCaptured && (
              <>
                <input ref={combinedRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => localRef.current?.click()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {isUploaded ? "Replace" : "Upload"}
                </button>
              </>
            )}
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              >
                Generate
              </button>
            )}
            {isUploaded && !autoCaptured && (
              <button type="button" onClick={onRemove} className="text-xs text-slate-400 hover:text-red-600">
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [generator, setGenerator] = useState<{ docType: GeneratorDocType; uploadSlot: string } | null>(null);
  const [extraSlots, setExtraSlots] = useState<{ key: string; label: string }[]>([]);
  const [newSlotLabel, setNewSlotLabel] = useState("");
  const [showAddSlot, setShowAddSlot] = useState(false);

  const isUKResident = data.countryOfResidence === "gb";
  const isEmployed = data.employmentStatus === "employed";
  const isSelfEmployed = data.employmentStatus === "self-employed";
  const isVisiting = data.purposeOfTravel === "visiting";
  const isBusiness = data.purposeOfTravel === "business";
  const isTourism = data.purposeOfTravel === "tourism";

  function getDoc(docId: string, altTypes?: string[]): UploadedDocument | undefined {
    const types = [docId, ...(altTypes ?? [])];
    return data.uploadedDocuments.find((d) => types.includes(d.documentType));
  }

  async function handleUpload(docId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(docId);
    setUploadErrors((prev) => { const n = { ...prev }; delete n[docId]; return n; });
    const result = await uploadDocument(file, docId);
    if (!result) {
      // uploadDocument returns null on error; the error message is in ApplyFlow's saveMessage.
      // Pull the last error from the global error display if present, or use a generic message.
      setUploadErrors((prev) => ({
        ...prev,
        [docId]: "Upload was rejected. Please check the document and try again.",
      }));
    }
    setUploadingId(null);
    const ref = inputRefs.current[docId];
    if (ref) ref.value = "";
  }

  async function handleRemove(docId: string, altTypes?: string[]) {
    const doc = getDoc(docId, altTypes);
    if (doc) await deleteDocument(doc.id);
  }

  function handleAddSlot() {
    if (!newSlotLabel.trim()) return;
    setExtraSlots((prev) => [...prev, { key: `extra_${Date.now()}`, label: newSlotLabel.trim() }]);
    setNewSlotLabel("");
    setShowAddSlot(false);
  }

  // Build must-have list
  const mustHaveDocs: DocConfig[] = [
    ...MUST_HAVE_DOCS,
    ...(isEmployed ? [{ id: "payslip", label: "Payslips", desc: "Last 3 months from your employer", icon: "💰" }] : []),
    ...(isSelfEmployed ? SELF_EMPLOYED_DOCS : []),
    ...(isUKResident
      ? [{ id: "brp", label: "BRP / Residence permit", desc: "Auto-captured in Step 3", icon: "🏠", altTypes: ["residence_permit", "visa_vignette", "evisa"], autoCaptured: true }]
      : []),
  ];

  // Build good-to-have list
  const goodToHaveDocs: DocConfig[] = [
    GOOD_TO_HAVE_DOCS[0], // cover letter — always
    ...(isVisiting ? [GOOD_TO_HAVE_DOCS[1]] : []),
    ...(isBusiness ? [GOOD_TO_HAVE_DOCS[2]] : []),
    ...(isTourism ? [GOOD_TO_HAVE_DOCS[3]] : []),
  ];

  const allDocs = [...mustHaveDocs, ...SHOULD_HAVE_DOCS, ...goodToHaveDocs];
  const uploadedCount = allDocs.filter((d) => getDoc(d.id, d.altTypes)).length;

  return (
    <>
      <TipBox icon="📄">
        Upload clear, colour scans. Blurry or black-and-white documents are the #1 cause of delays.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 7 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Supporting documents.
      </h1>
      <p className="mt-2 text-slate-600">Your checklist is personalised to your profile.</p>

      <div className="mt-4 rounded-xl bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">
          ✓ {uploadedCount} / {allDocs.length} documents ready
        </p>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Required documents</h2>
        </div>
        <div className="space-y-3">
          {allDocs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              uploadedDoc={getDoc(doc.id, doc.altTypes)}
              isUploading={uploadingId === doc.id}
              autoCaptured={doc.autoCaptured}
              inputRef={(el) => { inputRefs.current[doc.id] = el; }}
              onUpload={(e) => handleUpload(doc.id, e)}
              onRemove={() => handleRemove(doc.id, doc.altTypes)}
              onGenerate={doc.canGenerate ? () => setGenerator({ docType: doc.canGenerate, uploadSlot: doc.id }) : undefined}
            />
          ))}

          {/* Extra document slots */}
          {extraSlots.map((slot) => (
            <DocRow
              key={slot.key}
              doc={{ id: "other", label: slot.label, desc: "Additional supporting document", icon: "📎" }}
              uploadedDoc={undefined}
              isUploading={uploadingId === slot.key}
              inputRef={(el) => { inputRefs.current[slot.key] = el; }}
              onUpload={(e) => handleUpload("other", e)}
              onRemove={() => setExtraSlots((prev) => prev.filter((s) => s.key !== slot.key))}
              onGenerate={() => setGenerator({ docType: "other", uploadSlot: "other" })}
            />
          ))}

          {/* Add custom document */}
          {showAddSlot ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary-300 bg-primary-50/30 p-4">
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSlot()}
                placeholder="Document name, e.g. Employer NOC"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                autoFocus
              />
              <button type="button" onClick={handleAddSlot} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Add
              </button>
              <button type="button" onClick={() => setShowAddSlot(false)} className="text-sm text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddSlot(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-primary-300 hover:text-primary-600 transition"
            >
              + Add another document
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          After upload, our system validates each document for completeness and minimum requirements.
        </p>
      </div>

      {generator && (
        <DocumentGeneratorModal
          docType={generator.docType}
          data={data}
          countryName={countryName}
          onClose={() => setGenerator(null)}
          onUse={async (file) => {
            setUploadingId(generator.uploadSlot);
            await uploadDocument(file, generator.uploadSlot);
            setUploadingId(null);
          }}
        />
      )}

      <StepFooter step={7} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
