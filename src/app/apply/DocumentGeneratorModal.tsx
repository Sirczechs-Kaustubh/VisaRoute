"use client";

import { useState } from "react";
import type { ApplicationData } from "./ApplyFlow";

export type GeneratorDocType =
  | "cover_letter"
  | "invitation_letter"
  | "appointment_letter"
  | "holiday_letter"
  | "other";

const DOC_TITLES: Record<GeneratorDocType, string> = {
  cover_letter: "Cover Letter",
  invitation_letter: "Invitation Letter",
  appointment_letter: "Appointment / Business Letter",
  holiday_letter: "Personal Travel Statement",
  other: "Custom Document",
};

interface CoverLetterValues {
  applicantName: string;
  passportNumber: string;
  travelDates: string;
  entryCity: string;
  purpose: string;
  employerName: string;
  jobTitle: string;
  accommodation: string;
  financialStatement: string;
  previousVisits: string;
  customNote: string;
}

interface InvitationValues {
  hostName: string;
  hostAddress: string;
  relationship: string;
  stayDuration: string;
  hostContact: string;
  customNote: string;
}

interface AppointmentValues {
  companyName: string;
  contactPerson: string;
  contactTitle: string;
  meetingPurpose: string;
  meetingDates: string;
  companyAddress: string;
  customNote: string;
}

interface HolidayValues {
  applicantName: string;
  travelDates: string;
  motivation: string;
  itinerary: string;
  accommodation: string;
  companions: string;
  returnIntent: string;
  customNote: string;
}

interface OtherValues {
  title: string;
  body: string;
}

type FormValues = CoverLetterValues | InvitationValues | AppointmentValues | HolidayValues | OtherValues;

function getDefaultValues(
  docType: GeneratorDocType,
  data: ApplicationData,
  countryName: string,
): FormValues {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "";
  const dates =
    data.travelStartDate && data.travelEndDate
      ? `${data.travelStartDate} to ${data.travelEndDate}`
      : "";
  const purposeMap: Record<string, string> = {
    tourism: "tourism / leisure",
    business: "business meetings",
    visiting: "visiting family",
    study: "study",
    medical: "medical treatment",
    transit: "transit",
  };

  switch (docType) {
    case "cover_letter":
      return {
        applicantName: fullName,
        passportNumber: data.passportNumber || "",
        travelDates: dates,
        entryCity: data.entryCity || "",
        purpose: purposeMap[data.purposeOfTravel] || data.purposeOfTravel,
        employerName: "",
        jobTitle: "",
        accommodation: "",
        financialStatement:
          "I have sufficient personal funds to cover all travel, accommodation, and living expenses during my stay. My bank statements for the past three months are enclosed as supporting evidence.",
        previousVisits: "",
        customNote: "",
      } as CoverLetterValues;
    case "invitation_letter":
      return {
        hostName: "",
        hostAddress: "",
        relationship: "",
        stayDuration: dates,
        hostContact: "",
        customNote: "",
      } as InvitationValues;
    case "appointment_letter":
      return {
        companyName: "",
        contactPerson: "",
        contactTitle: "",
        meetingPurpose: "",
        meetingDates: dates,
        companyAddress: "",
        customNote: "",
      } as AppointmentValues;
    case "holiday_letter":
      return {
        applicantName: fullName,
        travelDates: dates,
        motivation: `I have long been fascinated by ${countryName} and this trip is an opportunity to experience its culture, history, and landscapes first-hand.`,
        itinerary: `[Describe your day-by-day or city-by-city plans here. For example: "I plan to arrive on [date] and spend the first three days in [city], visiting [attractions]. On [date] I will travel to [next city]..."]`,
        accommodation: "",
        companions: "I am travelling alone.",
        returnIntent: "I am due back at work on [return date] and my leave has been approved by my employer. I have strong ties to my home country and will return as planned.",
        customNote: "",
      } as HolidayValues;
    case "other":
      return { title: "", body: "" } as OtherValues;
  }
}

function generatePreviewText(
  docType: GeneratorDocType,
  values: FormValues,
  countryName: string,
): string {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  switch (docType) {
    case "cover_letter": {
      const v = values as CoverLetterValues;
      const employerPara = v.employerName || v.jobTitle
        ? `I am currently employed as ${v.jobTitle || "[job title]"} at ${v.employerName || "[employer]"}. I have obtained approved annual leave for the duration of this trip and will return to my position upon completion of my visit.`
        : "[Employment: add your employer name and job title in the form]";
      const previousVisitsPara = v.previousVisits
        ? `I have previously visited the Schengen area (${v.previousVisits}) and complied fully with all visa conditions on each occasion.`
        : "";
      return `${today}

The Visa Section
Consulate / Embassy of ${countryName}

Subject: Schengen Visa Application – ${v.purpose || "Tourism"}

Dear Sir/Madam,

I, ${v.applicantName || "[Full Name]"}, am writing to apply for a Schengen short-stay visa to visit ${countryName} for the purpose of ${v.purpose || "[purpose]"}. My planned travel dates are ${v.travelDates || "[travel dates]"}${v.entryCity ? `, with my point of entry being ${v.entryCity}` : ""}.${v.passportNumber ? ` My passport number is ${v.passportNumber}.` : ""}

${employerPara}

${v.accommodation ? `During my stay, I have arranged accommodation at ${v.accommodation}. A booking confirmation is enclosed with this application.` : "Details of my accommodation are enclosed with this application."}

${v.financialStatement}
${previousVisitsPara ? `\n${previousVisitsPara}` : ""}
${v.customNote ? `\n${v.customNote}\n` : ""}
I have enclosed all required supporting documents. I confirm that I intend to return to my country of residence upon completion of my visit and will fully comply with all conditions of the visa.

I kindly request you to consider my application favourably.

Yours faithfully,


${v.applicantName || "[Your Name]"}`;
    }

    case "invitation_letter": {
      const v = values as InvitationValues;
      return `${today}

To the ${countryName} Embassy / Consulate

RE: Letter of Invitation for ${countryName} Visa

Dear Sir/Madam,

I, ${v.hostName || "[Host Full Name]"}, residing at ${v.hostAddress || "[Your Full Address]"}, hereby invite ${v.relationship ? `my ${v.relationship}` : "[applicant's relationship]"} to visit me in ${countryName}.

The duration of the visit will be: ${v.stayDuration || "[dates]"}.

I confirm that I will be responsible for accommodation during this period.
${v.hostContact ? `\nFor any queries, I can be reached at: ${v.hostContact}` : ""}
${v.customNote ? `\n${v.customNote}` : ""}

Yours sincerely,

${v.hostName || "[Host Name]"}`;
    }

    case "appointment_letter": {
      const v = values as AppointmentValues;
      return `${today}

The Visa Officer
${countryName} Embassy / Consulate

RE: Business Visit Confirmation – ${v.companyName || "[Company Name]"}

Dear Sir/Madam,

This letter is to confirm that ${v.contactPerson || "[Contact Person]"}${v.contactTitle ? `, ${v.contactTitle}` : ""} at ${v.companyName || "[Company Name]"} has arranged a business appointment with the applicant.

Purpose of visit: ${v.meetingPurpose || "[Meeting Purpose]"}
Scheduled dates: ${v.meetingDates || "[Meeting Dates]"}
${v.companyAddress ? `Location: ${v.companyAddress}` : ""}

${v.customNote || "All accommodation and travel costs will be borne by the applicant."}

Yours sincerely,

${v.contactPerson || "[Contact Person]"}
${v.companyName || "[Company]"}`;
    }

    case "holiday_letter": {
      const v = values as HolidayValues;
      return `${today}

To the Visa Officer
Consulate / Embassy of ${countryName}

RE: Personal Travel Statement – ${v.applicantName || "[Your Name]"}

Dear Sir/Madam,

I am writing to provide details of my planned visit to ${countryName}${v.travelDates ? ` from ${v.travelDates}` : ""}, and to explain the personal significance and purpose of this trip.

${v.motivation || "[Explain why you want to visit this country — your personal interest, cultural connection, or specific attractions you've always wanted to see.]"}

${v.itinerary || "[Describe your day-by-day or city-by-city itinerary here.]"}

${v.accommodation ? `Accommodation: I have booked ${v.accommodation} for the duration of my stay, and the booking confirmation is enclosed.` : ""}

${v.companions || "I am travelling alone."}

${v.returnIntent || "[Explain your ties to your home country and your intention to return — your job, family, property, or other commitments.]"}
${v.customNote ? `\n${v.customNote}` : ""}

I hope this statement provides a clear picture of my plans and genuine intent to visit ${countryName}. I look forward to this experience and am grateful for the opportunity to present my application.

Yours faithfully,


${v.applicantName || "[Your Name]"}`;
    }

    case "other": {
      const v = values as OtherValues;
      return `${v.title ? v.title + "\n\n" : ""}${today}\n\n${v.body || "[Document content]"}`;
    }
  }
}

async function generateAndDownloadDocx(
  docType: GeneratorDocType,
  values: FormValues,
  countryName: string,
): Promise<void> {
  const { Document, Paragraph, TextRun, AlignmentType, Packer } = await import("docx");

  const previewText = generatePreviewText(docType, values, countryName);
  const lines = previewText.split("\n");

  const children = lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: "Arial", size: 22 })],
        spacing: { after: line === "" ? 120 : 0 },
      }),
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${DOC_TITLES[docType].toLowerCase().replace(/\s+/g, "-")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CoverLetterForm({
  values,
  onChange,
}: {
  values: CoverLetterValues;
  onChange: (v: CoverLetterValues) => void;
}) {
  const set = (key: keyof CoverLetterValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Formal letter to the embassy. Covers who you are, why you&apos;re applying, your employment, and your intent to return.</p>
      <Field label="Your full name" value={values.applicantName} onChange={set("applicantName")} />
      <Field label="Passport number" value={values.passportNumber} onChange={set("passportNumber")} />
      <Field label="Travel dates" value={values.travelDates} onChange={set("travelDates")} placeholder="e.g. 10 Jun 2025 to 24 Jun 2025" />
      <Field label="Entry city / airport" value={values.entryCity} onChange={set("entryCity")} placeholder="e.g. Paris CDG" />
      <Field label="Purpose of visit" value={values.purpose} onChange={set("purpose")} placeholder="e.g. tourism / business meetings" />
      <Field label="Employer name" value={values.employerName} onChange={set("employerName")} placeholder="e.g. Acme Ltd" />
      <Field label="Your job title" value={values.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Software Engineer" />
      <Field label="Accommodation" value={values.accommodation} onChange={set("accommodation")} placeholder="Hotel name, city" />
      <TextArea label="Financial declaration" value={values.financialStatement} onChange={set("financialStatement")} rows={3} />
      <Field label="Previous Schengen visits (optional)" value={values.previousVisits} onChange={set("previousVisits")} placeholder="e.g. Germany 2023, Italy 2024" />
      <TextArea label="Additional notes (optional)" value={values.customNote} onChange={set("customNote")} rows={2} />
    </div>
  );
}

function InvitationLetterForm({
  values,
  onChange,
}: {
  values: InvitationValues;
  onChange: (v: InvitationValues) => void;
}) {
  const set = (key: keyof InvitationValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <Field label="Host full name" value={values.hostName} onChange={set("hostName")} />
      <Field label="Host address" value={values.hostAddress} onChange={set("hostAddress")} />
      <Field label="Relationship to host" value={values.relationship} onChange={set("relationship")} placeholder="e.g. cousin, friend, colleague" />
      <Field label="Duration of stay" value={values.stayDuration} onChange={set("stayDuration")} />
      <Field label="Host contact (phone/email)" value={values.hostContact} onChange={set("hostContact")} />
      <TextArea label="Additional notes (optional)" value={values.customNote} onChange={set("customNote")} rows={2} />
    </div>
  );
}

function AppointmentLetterForm({
  values,
  onChange,
}: {
  values: AppointmentValues;
  onChange: (v: AppointmentValues) => void;
}) {
  const set = (key: keyof AppointmentValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <Field label="Company / organisation name" value={values.companyName} onChange={set("companyName")} />
      <Field label="Contact person name" value={values.contactPerson} onChange={set("contactPerson")} />
      <Field label="Contact title / position" value={values.contactTitle} onChange={set("contactTitle")} />
      <Field label="Purpose of meeting" value={values.meetingPurpose} onChange={set("meetingPurpose")} />
      <Field label="Meeting dates" value={values.meetingDates} onChange={set("meetingDates")} />
      <Field label="Company address" value={values.companyAddress} onChange={set("companyAddress")} />
      <TextArea label="Additional notes (optional)" value={values.customNote} onChange={set("customNote")} rows={2} />
    </div>
  );
}

function HolidayLetterForm({
  values,
  onChange,
}: {
  values: HolidayValues;
  onChange: (v: HolidayValues) => void;
}) {
  const set = (key: keyof HolidayValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Personal narrative explaining WHY you&apos;re visiting, your day-by-day plans, and your genuine intent to return. Different in tone from the cover letter.</p>
      <Field label="Your full name" value={values.applicantName} onChange={set("applicantName")} />
      <Field label="Travel dates" value={values.travelDates} onChange={set("travelDates")} placeholder="e.g. 10 Jun 2025 to 24 Jun 2025" />
      <TextArea label="Why this destination? (personal motivation)" value={values.motivation} onChange={set("motivation")} rows={3} />
      <TextArea label="Day-by-day itinerary" value={values.itinerary} onChange={set("itinerary")} rows={6} placeholder={"e.g. Days 1–3 (Paris): Visiting the Louvre, Musée d'Orsay and Notre-Dame...\nDay 4 (Lyon): Travelling by train, exploring the UNESCO old town..."} />
      <Field label="Accommodation" value={values.accommodation} onChange={set("accommodation")} placeholder="e.g. Hotel Saint-Germain, Paris (nights 1–4)" />
      <Field label="Travelling with" value={values.companions} onChange={set("companions")} placeholder="e.g. I am travelling alone / with my partner" />
      <TextArea label="Return intent (job, family, ties to home)" value={values.returnIntent} onChange={set("returnIntent")} rows={2} />
      <TextArea label="Additional notes (optional)" value={values.customNote} onChange={set("customNote")} rows={2} />
    </div>
  );
}

function OtherForm({ values, onChange }: { values: OtherValues; onChange: (v: OtherValues) => void }) {
  const set = (key: keyof OtherValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <Field label="Document title" value={values.title} onChange={set("title")} />
      <TextArea label="Document content" value={values.body} onChange={set("body")} rows={12} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
      />
    </div>
  );
}

export function DocumentGeneratorModal({
  docType,
  data,
  countryName,
  onClose,
  onUse,
}: {
  docType: GeneratorDocType;
  data: ApplicationData;
  countryName: string;
  onClose: () => void;
  onUse?: (file: File) => Promise<void>;
}) {
  const [formValues, setFormValues] = useState<FormValues>(() =>
    getDefaultValues(docType, data, countryName),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiGeneratedText, setAIGeneratedText] = useState<string | null>(null);
  const [isUsing, setIsUsing] = useState(false);
  const [used, setUsed] = useState(false);

  const supportsAI = docType === "cover_letter" || docType === "holiday_letter";

  const templateText = generatePreviewText(docType, formValues, countryName);
  const previewText = aiGeneratedText ?? templateText;

  async function handleAIGenerate() {
    setIsAIGenerating(true);
    setAIError(null);
    try {
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, countryName, data }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAIError(body.error?.message ?? "AI generation failed");
        return;
      }
      // Wrap AI body with proper letter header/footer
      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const applicantName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "[Your Name]";
      if (docType === "cover_letter") {
        const header = `${today}\n\nThe Visa Section\nConsulate / Embassy of ${countryName}\n\nSubject: Schengen Visa Application\n\nDear Sir/Madam,\n\n`;
        const footer = `\n\nYours faithfully,\n\n\n${applicantName}`;
        setAIGeneratedText(header + body.text + footer);
      } else if (docType === "holiday_letter") {
        const header = `${today}\n\nTo the Visa Officer\nConsulate / Embassy of ${countryName}\n\nRE: Personal Travel Statement – ${applicantName}\n\nDear Sir/Madam,\n\n`;
        const footer = `\n\nYours faithfully,\n\n\n${applicantName}`;
        setAIGeneratedText(header + body.text + footer);
      } else {
        setAIGeneratedText(body.text);
      }
    } catch {
      setAIError("Network error — please try again");
    } finally {
      setIsAIGenerating(false);
    }
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateAndDownloadDocx(docType, formValues, countryName);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = async () => {
    if (!onUse) return;
    setIsUsing(true);
    try {
      const { Document, Paragraph, TextRun, Packer } = await import("docx");
      const lines = previewText.split("\n");
      const children = lines.map(
        (line) => new Paragraph({ children: [new TextRun({ text: line, font: "Arial", size: 22 })] }),
      );
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const fileName = `${DOC_TITLES[docType].toLowerCase().replace(/\s+/g, "-")}.docx`;
      const file = new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      await onUse(file);
      setUsed(true);
    } finally {
      setIsUsing(false);
    }
  };

  function renderForm() {
    switch (docType) {
      case "cover_letter":
        return <CoverLetterForm values={formValues as CoverLetterValues} onChange={(v) => setFormValues(v)} />;
      case "invitation_letter":
        return <InvitationLetterForm values={formValues as InvitationValues} onChange={(v) => setFormValues(v)} />;
      case "appointment_letter":
        return <AppointmentLetterForm values={formValues as AppointmentValues} onChange={(v) => setFormValues(v)} />;
      case "holiday_letter":
        return <HolidayLetterForm values={formValues as HolidayValues} onChange={(v) => setFormValues(v)} />;
      case "other":
        return <OtherForm values={formValues as OtherValues} onChange={(v) => setFormValues(v)} />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generate {DOC_TITLES[docType]}</h2>
            <p className="text-xs text-slate-500">Fill in the fields — the preview updates live. Download as .docx when ready.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <div className="w-1/2 overflow-auto border-r border-slate-200 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Your details</p>
            {renderForm()}
          </div>

          {/* Right: preview */}
          <div className="w-1/2 overflow-auto bg-slate-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {aiGeneratedText ? "AI-generated preview" : "Live preview"}
              </p>
              {aiGeneratedText && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">✨ AI</span>
              )}
            </div>
            <div className="min-h-full rounded-xl border border-slate-200 bg-white p-6 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap shadow-sm">
              {isAIGenerating ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
                  Writing your personalised document...
                </div>
              ) : previewText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {used ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span>✓</span> Document added to your application
              </p>
            ) : supportsAI ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isAIGenerating || isGenerating || isUsing}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {isAIGenerating ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating...
                    </>
                  ) : (
                    <>✨ Generate with AI</>
                  )}
                </button>
                {aiGeneratedText && (
                  <p className="text-xs text-violet-600">AI-generated — edit fields or regenerate</p>
                )}
                {aiError && <p className="text-xs text-rose-600">{aiError}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Fill in the fields — preview updates live.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {used ? "Close" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || isUsing || isAIGenerating}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Download .docx"}
            </button>
            {onUse && (
              <button
                type="button"
                onClick={handleUse}
                disabled={isUsing || isGenerating || isAIGenerating || used}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUsing ? "Uploading..." : used ? "✓ Added" : "Use in application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
