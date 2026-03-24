/**
 * AI prompt templates for document generation and checks.
 * Designed for cost-effective generation with clear, structured outputs.
 */

// ─── Cover Letter Generation ────────────────────────────

export const COVER_LETTER_SYSTEM_PROMPT = `You are an expert visa application consultant who writes personalised cover letters for visa applications. Your letters are professional, concise, and structured to maximise approval probability.

Rules:
- Write in first person from the applicant's perspective
- Be formal but not overly verbose — consular officers review hundreds of applications
- Address the specific visa type and destination
- Mention strong ties to home country (employment, family, property) to demonstrate return intent
- If there are previous refusals, acknowledge them transparently and explain what has changed
- If there is visa history, mention compliance with previous visa conditions
- Keep the letter to 1 page (300-400 words)
- Do NOT include the date, addressee, or subject line — those are added separately
- Do NOT include "Dear Sir/Madam" or "Yours faithfully" — those are added separately
- Start directly with "I, [Name], am writing to apply..."
- End with "I kindly request you to consider my application favourably."
- Output ONLY the letter body text, no markdown formatting`;

export function buildCoverLetterUserPrompt(data: {
  name: string;
  destination: string;
  countryGroup: string;
  purpose: string;
  travelStart: string;
  travelEnd: string;
  tripDays: number | null;
  entryCity: string | null;
  accommodation: string | null;
  countryOfResidence: string | null;
  applyingFrom: string | null;
  employmentStatus: string | null;
  visaHistory: { country: string; year: string }[];
  refusals: { country: string; year: string; reason: string | null }[];
}): string {
  let prompt = `Write a visa cover letter for the following applicant:

Applicant name: ${data.name}
Destination country: ${data.destination}
Visa type: ${data.countryGroup === "schengen" ? "Schengen short-stay" : data.countryGroup === "uk" ? "UK Standard Visitor" : data.countryGroup === "us" ? "US B1/B2" : `${data.destination} visitor visa`}
Purpose of travel: ${data.purpose}
Travel dates: ${data.travelStart} to ${data.travelEnd}${data.tripDays ? ` (${data.tripDays} days)` : ""}`;

  if (data.entryCity) prompt += `\nEntry city: ${data.entryCity}`;
  if (data.accommodation) prompt += `\nAccommodation: ${data.accommodation}`;
  if (data.countryOfResidence) prompt += `\nCountry of residence: ${data.countryOfResidence}`;
  if (data.applyingFrom) prompt += `\nApplying from: ${data.applyingFrom}`;
  if (data.employmentStatus) prompt += `\nEmployment status: ${data.employmentStatus}`;

  if (data.visaHistory.length > 0) {
    prompt += `\n\nPrevious visa/travel history:`;
    for (const v of data.visaHistory) {
      prompt += `\n- ${v.country} (${v.year})`;
    }
  }

  if (data.refusals.length > 0) {
    prompt += `\n\nPrevious visa refusals (MUST be addressed transparently):`;
    for (const r of data.refusals) {
      prompt += `\n- ${r.country} (${r.year})${r.reason ? `: ${r.reason}` : ""}`;
    }
  }

  return prompt;
}

// ─── AI-Powered Document Check ──────────────────────────

export const DOCUMENT_CHECK_SYSTEM_PROMPT = `You are a visa application reviewer. Analyse the provided application data and return a JSON array of observations. Each observation should have:
- "code": a short identifier (e.g. "weak_financials", "date_mismatch")
- "severity": "error" | "warning" | "info"
- "title": short title (under 60 chars)
- "detail": explanation of the issue and how to fix it

Focus on:
1. Consistency between stated purpose and supporting documents
2. Financial adequacy for the trip duration
3. Travel date alignment across documents
4. Employment/ties to home country strength
5. Refusal history risk factors
6. Missing recommended documents

Return ONLY a valid JSON array. No markdown, no explanation outside the JSON.
Maximum 5 observations, ordered by severity (errors first).`;

export function buildDocumentCheckPrompt(data: {
  destination: string;
  countryGroup: string;
  purpose: string | null;
  travelStart: string | null;
  travelEnd: string | null;
  tripDays: number | null;
  employmentStatus: string | null;
  uploadedDocTypes: string[];
  extractedPassportExpiry: string | null;
  hasRefusals: boolean;
  refusalCount: number;
  visaHistoryCount: number;
}): string {
  return `Analyse this visa application for ${data.destination} (${data.countryGroup} group):

Purpose: ${data.purpose ?? "Not specified"}
Travel dates: ${data.travelStart ?? "?"} to ${data.travelEnd ?? "?"} (${data.tripDays ?? "?"} days)
Employment: ${data.employmentStatus ?? "Not specified"}
Documents uploaded: ${data.uploadedDocTypes.join(", ") || "None"}
Passport expiry: ${data.extractedPassportExpiry ?? "Not extracted"}
Previous refusals: ${data.hasRefusals ? `Yes (${data.refusalCount})` : "No"}
Previous visa history: ${data.visaHistoryCount} prior visit(s)

Return your observations as a JSON array.`;
}
