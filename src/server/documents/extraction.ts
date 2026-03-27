import { db } from "@/db/client";
import { getStorage } from "./storage";

export interface PassportData {
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  passportNumber: string | null;
  expiryDate: string | null;
  issuingCountry: string | null;
  issueDate: string | null;
  issuePlace: string | null;
}

export interface ResidenceData {
  documentNumber: string | null;
  expiryDate: string | null;
  holderName: string | null;
  documentType: string | null;
}

export interface ExtractionResult {
  type: "passport" | "residence";
  data: PassportData | ResidenceData;
  confidence: number;
  raw: string;
  method: "vision" | "mrz-text" | "regex-text" | "none";
}

const EMPTY_PASSPORT: PassportData = {
  firstName: null, lastName: null, nationality: null,
  dateOfBirth: null, sex: null, passportNumber: null,
  expiryDate: null, issuingCountry: null, issueDate: null, issuePlace: null,
};

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ─── MRZ helpers (for text-based PDFs) ──────────────────────────────────────

function findMrzLines(text: string): string[] | null {
  const cleaned = text.replace(/\r\n/g, "\n");
  const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);

  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i].replace(/\s/g, "");
    const line2 = lines[i + 1]?.replace(/\s/g, "");

    if (line1.length >= 42 && line1.length <= 46 && line1.startsWith("P")) {
      if (line2 && line2.length >= 42 && line2.length <= 46) {
        return [line1.padEnd(44, "<").slice(0, 44), line2.padEnd(44, "<").slice(0, 44)];
      }
    }
  }
  return null;
}

function parseMrzDate(raw: string): string | null {
  if (!raw || raw.length !== 6) return null;
  const yy = parseInt(raw.slice(0, 2), 10);
  const mm = raw.slice(2, 4);
  const dd = raw.slice(4, 6);
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  const mmNum = parseInt(mm, 10);
  const ddNum = parseInt(dd, 10);
  if (mmNum < 1 || mmNum > 12 || ddNum < 1 || ddNum > 31) return null;
  return `${year}-${mm}-${dd}`;
}

function parseMrzName(nameField: string): { lastName: string; firstName: string } {
  const parts = nameField.split("<<");
  const lastName = (parts[0] ?? "").replace(/</g, " ").trim();
  const firstName = (parts[1] ?? "").replace(/</g, " ").trim();
  return { lastName, firstName };
}

function extractIssueDateFromText(text: string): string | null {
  const patterns = [
    /(?:date\s*of\s*issue|issued?\s*on|date\s*issued)[:\s]+(\d{1,2}[\s/.\-]\d{1,2}[\s/.\-]\d{2,4})/i,
    /(?:date\s*of\s*issue|issued?\s*on|date\s*issued)[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /(?:d(?:ate)?\.?\s*of\s*issue)[:\s]+(\d{1,2}[\s/.\-]\w{3}[\s/.\-]\d{2,4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractIssuePlaceFromText(text: string): string | null {
  const patterns = [
    /(?:place\s*of\s*issue|authority|issued\s*(?:at|by)|lieu\s*de\s*d.livrance)[:\s]+([A-Za-z][A-Za-z\s,]{2,40})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const firstLine = match[1].split("\n")[0];
      return firstLine ? firstLine.trim() : null;
    }
  }
  return null;
}

// ─── Text-based MRZ parsing (PDF with embedded text) ────────────────────────

async function parsePassportFromText(text: string): Promise<{ data: PassportData; method: "mrz-text" | "none" }> {
  const lines = findMrzLines(text);

  if (lines) {
    const line1 = lines[0];
    const line2 = lines[1];
    const issuingCountry = line1.slice(2, 5).replace(/</g, "").trim() || null;
    const nameField = line1.slice(5);
    const { firstName, lastName } = parseMrzName(nameField);
    const passportNumber = line2.slice(0, 9).replace(/</g, "").trim() || null;
    const dateOfBirth = parseMrzDate(line2.slice(13, 19));
    const sex = line2.slice(20, 21) === "M" ? "Male" : line2.slice(20, 21) === "F" ? "Female" : null;
    const expiryDate = parseMrzDate(line2.slice(21, 27));
    const nationality = line2.slice(10, 13).replace(/</g, "").trim() || null;

    return {
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        nationality,
        dateOfBirth,
        sex,
        passportNumber,
        expiryDate,
        issuingCountry,
        issueDate: extractIssueDateFromText(text),
        issuePlace: extractIssuePlaceFromText(text),
      },
      method: "mrz-text",
    };
  }

  // Try mrz package as fallback
  try {
    const { parse } = await import("mrz");
    const result = parse(text);
    if (result.valid) {
      return {
        data: {
          firstName: result.fields.firstName ?? null,
          lastName: result.fields.lastName ?? null,
          nationality: result.fields.nationality ?? null,
          dateOfBirth: result.fields.birthDate ?? null,
          sex: result.fields.sex ?? null,
          passportNumber: result.fields.documentNumber ?? null,
          expiryDate: result.fields.expirationDate ?? null,
          issuingCountry: result.fields.issuingState ?? null,
          issueDate: extractIssueDateFromText(text),
          issuePlace: extractIssuePlaceFromText(text),
        },
        method: "mrz-text",
      };
    }
  } catch {
    // mrz package unavailable or parse failed
  }

  return { data: { ...EMPTY_PASSPORT }, method: "none" };
}

// ─── Vision-based extraction (images & scanned PDFs via OpenRouter) ──────────

async function extractPassportFromImage(buffer: Buffer, mimeType: string): Promise<{ data: PassportData; method: "vision" | "none" }> {
  try {
    const { chatCompletionWithVision, isAIEnabled } = await import("../ai/openrouter");
    if (!isAIEnabled()) {
      return { data: { ...EMPTY_PASSPORT }, method: "none" };
    }

    const base64 = buffer.toString("base64");

    const systemPrompt =
      "You are a passport OCR system. Extract structured data from passport images with high accuracy. " +
      "Focus on the photo page. Use the MRZ (Machine Readable Zone) at the bottom for accuracy — it is the authoritative source for names, dates, and codes. " +
      "Return ONLY valid JSON. No markdown, no explanation, no surrounding text.";

    const userPrompt =
      "Extract all readable passport data from this image. Return exactly this JSON structure:\n" +
      "{\n" +
      '  "firstName": "string or null",\n' +
      '  "lastName": "string or null",\n' +
      '  "nationality": "3-letter ISO code e.g. GBR or null",\n' +
      '  "dateOfBirth": "YYYY-MM-DD or null",\n' +
      '  "sex": "Male or Female or null",\n' +
      '  "passportNumber": "string or null",\n' +
      '  "expiryDate": "YYYY-MM-DD or null",\n' +
      '  "issuingCountry": "3-letter ISO code or null",\n' +
      '  "issueDate": "YYYY-MM-DD or null",\n' +
      '  "issuePlace": "city/authority name or null"\n' +
      "}\n" +
      "Return null for any field you cannot read with confidence. Do not guess.";

    const { content } = await chatCompletionWithVision(systemPrompt, userPrompt, base64, mimeType);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in vision response");

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string | null>;

    return {
      data: {
        firstName: parsed.firstName ?? null,
        lastName: parsed.lastName ?? null,
        nationality: parsed.nationality ?? null,
        dateOfBirth: parsed.dateOfBirth ?? null,
        sex: parsed.sex ?? null,
        passportNumber: parsed.passportNumber ?? null,
        expiryDate: parsed.expiryDate ?? null,
        issuingCountry: parsed.issuingCountry ?? null,
        issueDate: parsed.issueDate ?? null,
        issuePlace: parsed.issuePlace ?? null,
      },
      method: "vision",
    };
  } catch (err) {
    console.error("Vision extraction failed:", err);
    return { data: { ...EMPTY_PASSPORT }, method: "none" };
  }
}

// ─── Residence document parsing ───────────────────────────────────────────────

function parseResidenceText(text: string): ResidenceData {
  const lines = text.split("\n").map((l) => l.trim());
  let documentNumber: string | null = null;
  let expiryDate: string | null = null;
  let holderName: string | null = null;

  for (const line of lines) {
    const numMatch = line.match(/(?:document|permit|card)\s*(?:no|number|#)[:\s]*([A-Z0-9]{6,})/i);
    if (numMatch && !documentNumber) documentNumber = numMatch[1];

    const dateMatch = line.match(/(?:expiry|expires|valid\s*(?:until|to))[:\s]*(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/i);
    if (dateMatch && !expiryDate) expiryDate = dateMatch[1];

    const nameMatch = line.match(/(?:name|holder)[:\s]*([A-Za-z\s]{3,})/i);
    if (nameMatch && !holderName) holderName = nameMatch[1].trim();
  }

  return { documentNumber, expiryDate, holderName, documentType: null };
}

// ─── Main extraction entry point ──────────────────────────────────────────────

export async function runExtraction(documentId: string): Promise<ExtractionResult | null> {
  const document = await db.applicationDocument.findUnique({ where: { id: documentId } });

  if (!document || document.uploadStatus === "DELETED") return null;

  await db.applicationDocument.update({
    where: { id: documentId },
    data: { extractionStatus: "PROCESSING" },
  });

  try {
    const storage = getStorage();
    const buffer = await storage.read(document.storageKey);
    const isPassport = document.documentType === "passport" || document.documentType === "passport_back";
    const isImage = IMAGE_MIME_TYPES.has(document.mimeType);

    let result: ExtractionResult;

    if (isPassport) {
      let extracted: { data: PassportData; method: "vision" | "mrz-text" | "none" };

      if (isImage) {
        // Images must use vision — text parsing gives garbage on binary data
        extracted = await extractPassportFromImage(buffer, document.mimeType);
      } else {
        // PDF: attempt text-based MRZ extraction first
        const text = buffer.toString("utf-8");
        const textResult = await parsePassportFromText(text);

        const fieldsFound = Object.values(textResult.data).filter(Boolean).length;
        if (fieldsFound >= 3) {
          extracted = textResult;
        } else {
          // PDF is likely scanned/binary — fall back to vision
          extracted = await extractPassportFromImage(buffer, document.mimeType);
        }
      }

      const fieldsFound = Object.values(extracted.data).filter(Boolean).length;
      result = {
        type: "passport",
        data: extracted.data,
        confidence: fieldsFound / 10,
        raw: `[${extracted.method}]`,
        method: extracted.method,
      };
    } else {
      // Residence documents: text-based keyword extraction
      const text = buffer.toString("utf-8");
      const residenceData = parseResidenceText(text);
      const fieldsFound = Object.values(residenceData).filter(Boolean).length;
      result = {
        type: "residence",
        data: residenceData,
        confidence: fieldsFound / 4,
        raw: text.slice(0, 2000),
        method: "regex-text",
      };
    }

    await db.documentExtraction.create({
      data: {
        documentId,
        extractorVersion: `v2-${result.method}`,
        rawPayload: JSON.stringify({ method: result.method, raw: result.raw }),
        normalizedPayload: JSON.stringify(result.data),
        confidence: result.confidence,
      },
    });

    await db.applicationDocument.update({
      where: { id: documentId },
      data: { extractionStatus: result.confidence > 0 ? "COMPLETED" : "FAILED" },
    });

    return result;
  } catch (error) {
    console.error("Extraction failed for document:", documentId, error);
    await db.applicationDocument.update({
      where: { id: documentId },
      data: { extractionStatus: "FAILED" },
    });
    return null;
  }
}
