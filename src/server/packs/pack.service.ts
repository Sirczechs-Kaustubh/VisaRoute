import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";
import { getStorage, generateStorageKey } from "@/server/documents/storage";
import { isAIEnabled, generateText } from "@/server/ai/openrouter";
import {
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterUserPrompt,
} from "@/server/ai/prompts";
import {
  buildCoverLetterDoc,
  buildChecklistDoc,
  buildSummaryDoc,
  docToBuffer,
  type ChecklistItem,
  type SummarySection,
} from "@/server/ai/docx-builder";
import { sendNotificationEmail } from "@/server/notifications/email.service";

const PURPOSE_LABELS: Record<string, string> = {
  tourism: "Tourism", business: "Business", visiting: "Visiting family/friends",
  study: "Study", medical: "Medical treatment", transit: "Transit",
};

const DOC_LABELS: Record<string, string> = {
  passport: "Passport (photo page)",
  passport_back: "Passport (back page)",
  brp: "Biometric Residence Permit",
  visa_vignette: "Visa vignette",
  evisa: "eVisa document",
  residence_permit: "Residence permit",
  bank_statement: "Bank statements",
  travel_insurance: "Travel insurance",
  flight_booking: "Flight reservation",
  accommodation_proof: "Accommodation proof",
  employment_letter: "Employment letter",
  invitation_letter: "Invitation letter",
  photo: "Passport photo",
  cover_letter: "Cover letter",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: "currently employed",
  "self-employed": "self-employed",
  student: "currently a student",
  retired: "retired",
  unemployed: "currently not employed",
};

// ─── Addressee / Subject helpers ────────────────────────

function getAddressee(groupCode: string, destination: string): string {
  switch (groupCode) {
    case "schengen": return `To the Visa Section,\nConsulate General of ${destination}`;
    case "uk": return `To UK Visas and Immigration,\nHome Office`;
    case "us": return `To the Consular Officer,\nU.S. Embassy / Consulate`;
    case "canada": return `To the Visa Officer,\nImmigration, Refugees and Citizenship Canada`;
    case "australia": return `To the Visa Officer,\nDepartment of Home Affairs, Australia`;
    default: return `To the Visa Section,\nEmbassy / Consulate of ${destination}`;
  }
}

function getSubjectLine(groupCode: string, purpose: string): string {
  const prefix: Record<string, string> = {
    schengen: "Schengen Visa Application",
    uk: "UK Visitor Visa Application",
    us: "US Visa Application",
    canada: "Canadian Visa Application",
    australia: "Australian Visa Application",
  };
  return `${prefix[groupCode] ?? "Visa Application"} – ${purpose}`;
}

function getVisaLabel(groupCode: string): string {
  const map: Record<string, string> = {
    schengen: "Schengen visa", uk: "UK visitor visa",
    us: "US visa", canada: "Canadian visa", australia: "Australian visa",
  };
  return map[groupCode] ?? "visa";
}

// ─── Template-based cover letter (fallback) ─────────────

function buildTemplateLetter(data: {
  name: string; destination: string; purpose: string; countryGroupCode: string;
  travelStart: string | null; travelEnd: string | null; tripDays: number | null;
  entryCity: string | null; accommodation: string | null; countryOfResidence: string | null;
  employmentStatus: string | null;
  visaHistory: { country: string | null; year: string | null }[];
  refusals: { country: string | null; year: string | null; reason: string | null }[];
}): string {
  let body = `I, ${data.name}, am writing to apply for a ${getVisaLabel(data.countryGroupCode)} to visit ${data.destination} for the purpose of ${data.purpose.toLowerCase()}.`;

  if (data.travelStart && data.travelEnd) {
    body += ` My planned travel dates are from ${data.travelStart} to ${data.travelEnd}`;
    if (data.tripDays) body += ` (${data.tripDays} days)`;
    body += `.`;
  }
  if (data.entryCity) body += ` I intend to enter ${data.destination} via ${data.entryCity}.`;
  if (data.accommodation) body += ` My accommodation arrangements include staying at a ${data.accommodation.toLowerCase()}.`;

  body += `\n\n`;

  if (data.employmentStatus) {
    body += `I am ${EMPLOYMENT_LABELS[data.employmentStatus] ?? data.employmentStatus}`;
    if (data.countryOfResidence) body += ` and reside in ${data.countryOfResidence}`;
    body += `.\n\n`;
  }

  if (data.visaHistory.length > 0) {
    const list = data.visaHistory.map((v) => `${v.country ?? "Unknown"} (${v.year ?? "N/A"})`).join(", ");
    body += `I have previously visited the Schengen area: ${list}. All previous visits were in full compliance with visa conditions.\n\n`;
  }

  if (data.refusals.length > 0) {
    const list = data.refusals.map((r) => `${r.country ?? "Unknown"} (${r.year ?? "N/A"})${r.reason ? ` – ${r.reason}` : ""}`).join("; ");
    body += `I wish to disclose that I have previously had visa application(s) refused: ${list}. I have since addressed the concerns raised and believe my current application demonstrates compliance with all requirements.\n\n`;
  }

  body += `I have enclosed all required supporting documents as listed in the attached checklist. I confirm that I intend to return to my country of residence upon completion of my visit and will fully comply with the terms of the visa.\n\nI kindly request you to consider my application favourably.`;

  return body;
}

// ─── Service ────────────────────────────────────────────

export class PackService {
  async generatePack(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      include: {
        country: { include: { countryGroup: true } },
        applicantProfile: true,
        travelPlan: true,
        employmentProfile: true,
        companionGroup: true,
        visaHistoryEntries: { orderBy: { sortOrder: "asc" } },
        refusalHistoryEntries: { orderBy: { sortOrder: "asc" } },
        documents: {
          where: { uploadStatus: { not: "DELETED" } },
          include: { extractions: { take: 1, orderBy: { createdAt: "desc" } } },
        },
        generatedPack: true,
      },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const ap = application.applicantProfile;
    const tp = application.travelPlan;
    const group = application.country.countryGroup;
    const name = [ap?.firstName, ap?.lastName].filter(Boolean).join(" ") || "[Applicant Name]";
    const purpose = ap?.purposeOfTravel ? (PURPOSE_LABELS[ap.purposeOfTravel] ?? ap.purposeOfTravel) : "[Purpose]";
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const fmtDate = (d: Date | null | undefined) =>
      d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

    const travelStart = fmtDate(ap?.travelStartDate);
    const travelEnd = fmtDate(ap?.travelEndDate);

    const visaHistory = application.visaHistoryEntries.map((e) => ({
      country: e.countryName ?? "", year: e.yearLabel ?? "",
    }));
    const refusals = application.refusalHistoryEntries.map((e) => ({
      country: e.countryName ?? "", year: e.yearLabel ?? "", reason: e.reason ?? "",
    }));

    // ── Generate cover letter body (AI or template) ─────
    let coverLetterBody: string;
    let generationMethod: "ai" | "template";

    if (isAIEnabled()) {
      try {
        coverLetterBody = await generateText(
          COVER_LETTER_SYSTEM_PROMPT,
          buildCoverLetterUserPrompt({
            name,
            destination: application.country.name,
            countryGroup: group.code,
            purpose,
            travelStart: travelStart ?? "[Start Date]",
            travelEnd: travelEnd ?? "[End Date]",
            tripDays: tp?.tripLengthDays ?? null,
            entryCity: tp?.entryCity ?? null,
            accommodation: tp?.accommodationType ?? null,
            countryOfResidence: ap?.countryOfResidence ?? null,
            applyingFrom: application.applyingFromCountry,
            employmentStatus: application.employmentProfile?.employmentStatus ?? null,
            visaHistory,
            refusals: refusals.map((r) => ({ ...r, reason: r.reason || null })),
          }),
          { temperature: 0.3, maxTokens: 1500 },
        );
        generationMethod = "ai";
      } catch (err) {
        console.error("AI cover letter generation failed, falling back to template:", err);
        coverLetterBody = buildTemplateLetter({
          name, destination: application.country.name, purpose,
          countryGroupCode: group.code, travelStart, travelEnd,
          tripDays: tp?.tripLengthDays ?? null, entryCity: tp?.entryCity ?? null,
          accommodation: tp?.accommodationType ?? null,
          countryOfResidence: ap?.countryOfResidence ?? null,
          employmentStatus: application.employmentProfile?.employmentStatus ?? null,
          visaHistory: application.visaHistoryEntries.map((e) => ({ country: e.countryName, year: e.yearLabel })),
          refusals: application.refusalHistoryEntries.map((e) => ({ country: e.countryName, year: e.yearLabel, reason: e.reason })),
        });
        generationMethod = "template";
      }
    } else {
      coverLetterBody = buildTemplateLetter({
        name, destination: application.country.name, purpose,
        countryGroupCode: group.code, travelStart, travelEnd,
        tripDays: tp?.tripLengthDays ?? null, entryCity: tp?.entryCity ?? null,
        accommodation: tp?.accommodationType ?? null,
        countryOfResidence: ap?.countryOfResidence ?? null,
        employmentStatus: application.employmentProfile?.employmentStatus ?? null,
        visaHistory: application.visaHistoryEntries.map((e) => ({ country: e.countryName, year: e.yearLabel })),
        refusals: application.refusalHistoryEntries.map((e) => ({ country: e.countryName, year: e.yearLabel, reason: e.reason })),
      });
      generationMethod = "template";
    }

    // Full cover letter text (for DB storage and text preview)
    const addressee = getAddressee(group.code, application.country.name);
    const subject = getSubjectLine(group.code, purpose);
    const coverLetterText = `${today}\n\n${addressee}\n\nSubject: ${subject}\n\nDear Sir/Madam,\n\n${coverLetterBody}\n\nYours faithfully,\n${name}`;

    // ── Build checklist items ───────────────────────────
    const uploadedDocTypes = new Set(application.documents.map((d) => d.documentType));
    const allDocTypes = [
      "passport", "passport_back", "brp", "visa_vignette", "evisa", "residence_permit",
      "bank_statement", "travel_insurance", "flight_booking", "accommodation_proof",
      "employment_letter", "invitation_letter", "photo",
    ];

    const checklistItems: ChecklistItem[] = [];
    // Uploaded documents
    for (const doc of application.documents) {
      checklistItems.push({
        label: DOC_LABELS[doc.documentType] ?? doc.documentType,
        fileName: doc.originalFileName,
        status: "uploaded",
      });
    }
    // Recommended but missing
    const recommended = ["travel_insurance", "flight_booking", "accommodation_proof", "bank_statement"];
    for (const docType of recommended) {
      if (!uploadedDocTypes.has(docType)) {
        checklistItems.push({
          label: DOC_LABELS[docType] ?? docType,
          fileName: "",
          status: "recommended",
        });
      }
    }

    const checklistText = checklistItems
      .map((item, i) => {
        const marker = item.status === "uploaded" ? "[✓]" : item.status === "missing" ? "[✗]" : "[~]";
        return `${i + 1}. ${marker} ${item.label}${item.fileName ? `\n     File: ${item.fileName}` : ""}`;
      })
      .join("\n\n");

    // ── Build summary sections ──────────────────────────
    const summarySections: SummarySection[] = [
      {
        title: "Personal Information",
        fields: [
          { label: "Full Name", value: name },
          { label: "Email", value: ap?.email ?? "" },
          { label: "Phone", value: ap?.phoneNumber ?? "" },
          { label: "Country of Residence", value: ap?.countryOfResidence ?? "" },
          { label: "Applying From", value: application.applyingFromCountry ?? "" },
        ],
      },
      {
        title: "Travel Plan",
        fields: [
          { label: "Destination", value: application.country.name },
          { label: "Purpose", value: purpose },
          { label: "Travel Dates", value: travelStart && travelEnd ? `${travelStart} – ${travelEnd}` : "" },
          { label: "Duration", value: tp?.tripLengthDays ? `${tp.tripLengthDays} days` : "" },
          { label: "Entry City", value: tp?.entryCity ?? "" },
          { label: "Accommodation", value: tp?.accommodationType ?? "" },
          { label: "Multi-Country", value: tp?.multiCountryMode === "yes" ? "Yes" : tp?.multiCountryMode === "no" ? "No" : "" },
        ],
      },
      {
        title: "Companions",
        fields: [
          {
            label: "Travelling With",
            value: application.companionGroup?.travellingWithCompanions === "yes"
              ? `${application.companionGroup.companionsCount ?? 0} companion(s)`
              : application.companionGroup?.travellingWithCompanions === "no" ? "Solo" : "",
          },
        ],
      },
      {
        title: "Employment",
        fields: [
          { label: "Status", value: application.employmentProfile?.employmentStatus ?? "" },
        ],
      },
    ];

    if (visaHistory.length > 0) {
      summarySections.push({
        title: "Previous Schengen Visits",
        fields: visaHistory.map((v) => ({ label: v.country, value: v.year })),
      });
    }

    if (refusals.length > 0) {
      summarySections.push({
        title: "Previous Refusals",
        fields: refusals.map((r) => ({ label: `${r.country} (${r.year})`, value: r.reason || "No reason given" })),
      });
    }

    // ── Generate Word documents ─────────────────────────
    const coverLetterDoc = buildCoverLetterDoc({
      date: today,
      addressee,
      subject,
      body: coverLetterBody,
      applicantName: name,
    });

    const checklistDoc = buildChecklistDoc(
      checklistItems,
      name,
      application.country.name,
    );

    const summaryDoc = buildSummaryDoc(
      name,
      application.country.name,
      application.submissionRef,
      summarySections,
    );

    const [coverLetterBuffer, checklistBuffer, summaryBuffer] = await Promise.all([
      docToBuffer(coverLetterDoc),
      docToBuffer(checklistDoc),
      docToBuffer(summaryDoc),
    ]);

    // ── Store all files ─────────────────────────────────
    const storage = getStorage();
    const coverLetterDocxKey = generateStorageKey(application.id, "generated-cover-letter", "cover-letter.docx");
    const checklistDocxKey = generateStorageKey(application.id, "generated-checklist", "checklist.docx");
    const summaryDocxKey = generateStorageKey(application.id, "generated-summary", "summary.docx");
    const coverLetterTxtKey = generateStorageKey(application.id, "generated-cover-letter", "cover-letter.txt");

    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    await Promise.all([
      storage.upload(coverLetterDocxKey, coverLetterBuffer, docxMime),
      storage.upload(checklistDocxKey, checklistBuffer, docxMime),
      storage.upload(summaryDocxKey, summaryBuffer, docxMime),
      storage.upload(coverLetterTxtKey, Buffer.from(coverLetterText, "utf-8"), "text/plain"),
    ]);

    // ── Upsert pack record ──────────────────────────────
    const pack = await db.generatedPack.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        status: "generated",
        coverLetterStorageKey: coverLetterDocxKey,
        checklistStorageKey: checklistDocxKey,
        summaryStorageKey: summaryDocxKey,
        coverLetterText,
        checklistText,
        generatedAt: new Date(),
      },
      update: {
        status: "generated",
        coverLetterStorageKey: coverLetterDocxKey,
        checklistStorageKey: checklistDocxKey,
        summaryStorageKey: summaryDocxKey,
        coverLetterText,
        checklistText,
        generatedAt: new Date(),
      },
    });

    await db.application.update({
      where: { id: application.id },
      data: { status: "PACK_GENERATED" },
    });

    // Send pack ready email (non-blocking)
    const email = ap?.email;
    if (email) {
      sendNotificationEmail({
        to: email,
        type: "pack_ready",
        applicationId: application.id,
        data: {
          name,
          country: application.country.name,
          draftToken,
        },
      }).catch(() => {});
    }

    return {
      id: pack.id,
      status: pack.status,
      generatedAt: pack.generatedAt,
      generationMethod,
      coverLetter: {
        text: coverLetterText,
        docxUrl: storage.getUrl(coverLetterDocxKey),
        txtUrl: storage.getUrl(coverLetterTxtKey),
      },
      checklist: {
        text: checklistText,
        docxUrl: storage.getUrl(checklistDocxKey),
      },
      summary: {
        docxUrl: storage.getUrl(summaryDocxKey),
      },
    };
  }

  async getPack(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      include: { generatedPack: true },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    if (!application.generatedPack) {
      return null;
    }

    const pack = application.generatedPack;
    const storage = getStorage();

    return {
      id: pack.id,
      status: pack.status,
      generatedAt: pack.generatedAt,
      coverLetter: {
        text: pack.coverLetterText,
        docxUrl: pack.coverLetterStorageKey ? storage.getUrl(pack.coverLetterStorageKey) : null,
      },
      checklist: {
        text: pack.checklistText,
        docxUrl: pack.checklistStorageKey ? storage.getUrl(pack.checklistStorageKey) : null,
      },
      summary: {
        docxUrl: pack.summaryStorageKey ? storage.getUrl(pack.summaryStorageKey) : null,
      },
    };
  }
}
