/**
 * Document validation using vision AI (OpenRouter / Gemini Flash).
 *
 * Each uploaded document is analysed to confirm:
 *   1. It is the correct document type (not a random file)
 *   2. It is genuine — not a sample, template, SPECIMEN, or VOID form
 *   3. Key fields match the applicant profile (name, date range)
 *
 * Validation result status:
 *   PASSED  — document appears genuine and meets requirements
 *   WARNING — document is likely genuine but has a non-blocking issue (name mismatch, old date)
 *   FAILED  — document is clearly a sample/template/fake → upload REJECTED with 422
 *
 * When AI is not configured (OPENROUTER_API_KEY missing), returns null and upload proceeds.
 */

import { isAIEnabled, chatCompletionWithVision } from "../ai/openrouter";

export interface ValidationResult {
  status: "PASSED" | "WARNING" | "FAILED";
  detectedType: string;
  issues: string[];    // blocking problems (shown when FAILED)
  warnings: string[]; // non-blocking concerns (shown as warnings in UI)
  confidence: number; // 0-1
}

export interface ValidationContext {
  documentType: string;
  applicantName: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
}

// Document types that get validation (passport uses extraction instead)
const VALIDATED_DOC_TYPES = new Set([
  "bank_statement",
  "payslip",
  "travel_insurance",
  "flight_booking",
  "accommodation_proof",
  "business_registration",
  "tax_returns",
  "business_bank_statement",
  "profit_loss",
  "accountant_letter",
  "employment_letter",
]);

export function isValidatable(documentType: string): boolean {
  return VALIDATED_DOC_TYPES.has(documentType);
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return (
    "You are a strict document validation system for a Schengen visa application processor. " +
    "Analyse documents uploaded by visa applicants and detect: " +
    "(1) Documents that are clearly samples, templates, specimens, or placeholder forms from the internet. " +
    "(2) Documents that do not match the declared type. " +
    "(3) Documents that fail date or content requirements. " +
    "Indicators of FAKE/SAMPLE documents: 'SAMPLE' or 'SPECIMEN' watermarks, " +
    "placeholder names like 'John Doe'/'Jane Smith'/'Customer Name'/'Account Holder', " +
    "fake account numbers like '1234567890'/'XXXX-XXXX', " +
    "'VOID' or 'TEMPLATE' stamps, clearly fabricated identical round-number transactions, " +
    "blank fields where real data should appear, obvious internet template styling. " +
    "Be strict on these red flags. " +
    "Return ONLY valid JSON — no markdown, no explanation."
  );
}

function buildUserPrompt(ctx: ValidationContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 183 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const threeMonthsAgo = new Date(Date.now() - 92 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nameHint = ctx.applicantName ? `The applicant's name is "${ctx.applicantName}". ` : "";

  const instructions: Record<string, string> = {
    bank_statement:
      `Validate this bank statement. ${nameHint}Today is ${today}. ` +
      "FAILED if: any SAMPLE/SPECIMEN/VOID/TEMPLATE text visible, placeholder names (John Doe, Customer Name, Account Holder), " +
      "all transactions are identical round numbers, clearly a blank/demo form downloaded from internet. " +
      `WARNING if: statement end date is before ${sixMonthsAgo} (older than 6 months), ` +
      "account holder name does not match applicant name.",

    payslip:
      `Validate this payslip or salary slip. ${nameHint}Today is ${today}. ` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE visible, placeholder employee name, blank salary fields, demo form. " +
      `WARNING if: pay period end date is before ${threeMonthsAgo} (older than 3 months), ` +
      "employee name does not match applicant name.",

    travel_insurance:
      `Validate this travel insurance document. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder policyholder name, clearly a fake form. " +
      "WARNING if: coverage amount is less than €30,000, no mention of Schengen/Europe coverage, " +
      "policyholder name does not match applicant.",

    flight_booking:
      `Validate this flight booking or reservation. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder passenger name, obviously fabricated booking. " +
      "WARNING if: passenger name does not match applicant, travel dates missing.",

    accommodation_proof:
      `Validate this accommodation booking. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder guest name, blank booking form. " +
      "WARNING if: guest name does not match applicant, check-in/out dates missing.",

    business_registration:
      "Validate this business registration document. " +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, blank company name, placeholder registration number, demo form. " +
      "WARNING if: company name or registration number missing.",

    tax_returns:
      `Validate this tax return. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder taxpayer name, blank tax form. " +
      "WARNING if: taxpayer name missing or does not match applicant.",

    business_bank_statement:
      "Validate this business bank statement. " +
      "FAILED if: SAMPLE/SPECIMEN/VOID/TEMPLATE, placeholder company name, fake transactions, demo form. " +
      "WARNING if: company name missing.",

    profit_loss:
      "Validate this profit and loss statement. " +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, blank financial figures, placeholder company name. " +
      "WARNING if: no signature or date visible.",

    accountant_letter:
      `Validate this accountant or CPA letter. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder name, blank letter template. " +
      "WARNING if: no signature visible, client name does not match applicant.",

    employment_letter:
      `Validate this employment letter. ${nameHint}` +
      "FAILED if: SAMPLE/SPECIMEN/TEMPLATE, placeholder employee name, blank letter form. " +
      "WARNING if: no signature or company letterhead, employee name does not match applicant.",
  };

  const typePrompt = instructions[ctx.documentType] ??
    `Validate this document (declared type: ${ctx.documentType}). ` +
    "FAILED if clearly a sample, template, specimen, or blank form. WARNING if key data is missing.";

  return (
    typePrompt +
    "\n\nReturn exactly this JSON structure:\n" +
    "{\n" +
    '  "status": "PASSED" | "WARNING" | "FAILED",\n' +
    '  "detectedType": "brief description of what you see",\n' +
    '  "issues": ["list each blocking reason for FAILED — empty array if not FAILED"],\n' +
    '  "warnings": ["list each non-blocking concern — empty array if none"],\n' +
    '  "confidence": 0.0-1.0\n' +
    "}"
  );
}

// ─── Core vision call ─────────────────────────────────────────────────────────

async function runVisionValidation(
  buffer: Buffer,
  mimeType: string,
  ctx: ValidationContext,
): Promise<ValidationResult> {
  const base64 = buffer.toString("base64");

  const { content } = await chatCompletionWithVision(
    buildSystemPrompt(),
    buildUserPrompt(ctx),
    base64,
    mimeType,
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in validation response");

  const parsed = JSON.parse(jsonMatch[0]) as {
    status?: string;
    detectedType?: string;
    issues?: unknown;
    warnings?: unknown;
    confidence?: unknown;
  };

  const status: ValidationResult["status"] =
    parsed.status === "FAILED" ? "FAILED"
    : parsed.status === "WARNING" ? "WARNING"
    : "PASSED";

  return {
    status,
    detectedType: typeof parsed.detectedType === "string" ? parsed.detectedType : ctx.documentType,
    issues: Array.isArray(parsed.issues) ? (parsed.issues as string[]) : [],
    warnings: Array.isArray(parsed.warnings) ? (parsed.warnings as string[]) : [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate a document buffer before it is saved to storage.
 * Returns null if AI is disabled or document type is not validatable (DOCX etc.).
 * Returns ValidationResult — caller must handle FAILED status (reject upload).
 */
export async function validateBuffer(
  buffer: Buffer,
  mimeType: string,
  ctx: ValidationContext,
): Promise<ValidationResult | null> {
  if (!isAIEnabled()) return null;
  // DOCX files are generated by us — skip vision validation
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return null;

  try {
    return await runVisionValidation(buffer, mimeType, ctx);
  } catch (err) {
    console.error("[validation] Vision validation error:", err);
    return null; // Fail open — don't block upload if AI errors
  }
}
