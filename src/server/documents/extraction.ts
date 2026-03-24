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
}

/**
 * Parse MRZ lines from text using regex patterns.
 * MRZ for TD3 passports has 2 lines of 44 characters each.
 */
function findMrzLines(text: string): string[] | null {
  // Normalize: replace common OCR errors
  const cleaned = text
    .replace(/[oO]/g, (m, offset, str) => {
      // Only replace O with 0 in positions that look numeric
      return m;
    })
    .replace(/\r\n/g, "\n");

  const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);

  // Look for MRZ lines: starts with P< (passport) and is ~44 chars
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i].replace(/\s/g, "");
    const line2 = lines[i + 1]?.replace(/\s/g, "");

    if (line1.length >= 42 && line1.length <= 46 && line1.startsWith("P")) {
      if (line2 && line2.length >= 42 && line2.length <= 46) {
        // Pad or trim to exactly 44
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
  // Assume 2000s for years < 50, 1900s otherwise
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  return `${year}-${mm}-${dd}`;
}

function parseMrzName(nameField: string): { lastName: string; firstName: string } {
  const parts = nameField.split("<<");
  const lastName = (parts[0] ?? "").replace(/</g, " ").trim();
  const firstName = (parts[1] ?? "").replace(/</g, " ").trim();
  return { lastName, firstName };
}

/**
 * Parse passport data from MRZ text (TD3 format).
 * Uses the mrz npm package if available, with fallback to manual parsing.
 */
export async function parsePassportMrz(mrzText: string): Promise<PassportData> {
  const lines = findMrzLines(mrzText);

  if (!lines) {
    // Try using mrz package for more robust parsing
    try {
      const { parse } = await import("mrz");
      const result = parse(mrzText);
      if (result.valid) {
        return {
          firstName: result.fields.firstName ?? null,
          lastName: result.fields.lastName ?? null,
          nationality: result.fields.nationality ?? null,
          dateOfBirth: result.fields.birthDate ?? null,
          sex: result.fields.sex ?? null,
          passportNumber: result.fields.documentNumber ?? null,
          expiryDate: result.fields.expirationDate ?? null,
          issuingCountry: result.fields.issuingState ?? null,
        };
      }
    } catch {
      // mrz package unavailable or parse failed
    }

    return {
      firstName: null, lastName: null, nationality: null,
      dateOfBirth: null, sex: null, passportNumber: null,
      expiryDate: null, issuingCountry: null,
    };
  }

  // Manual TD3 parsing
  const line1 = lines[0];
  const line2 = lines[1];

  // Line 1: P<ISSUINGSTATE<LASTNAME<<FIRSTNAME<...
  const issuingCountry = line1.slice(2, 5).replace(/</g, "").trim() || null;
  const nameField = line1.slice(5);
  const { firstName, lastName } = parseMrzName(nameField);

  // Line 2: PASSPORTNUMBER<CHECK DOB CHECK SEX EXPIRY CHECK NATIONALITY ...
  const passportNumber = line2.slice(0, 9).replace(/</g, "").trim() || null;
  const dateOfBirth = parseMrzDate(line2.slice(13, 19));
  const sex = line2.slice(20, 21) === "M" ? "Male" : line2.slice(20, 21) === "F" ? "Female" : null;
  const expiryDate = parseMrzDate(line2.slice(21, 27));
  const nationality = line2.slice(10, 13).replace(/</g, "").trim() || null;

  return {
    firstName: firstName || null,
    lastName: lastName || null,
    nationality,
    dateOfBirth,
    sex,
    passportNumber,
    expiryDate,
    issuingCountry,
  };
}

/**
 * Parse basic data from residence document text (BRP, visa, etc.)
 * This is a best-effort keyword-based extraction.
 */
export function parseResidenceText(text: string): ResidenceData {
  const lines = text.split("\n").map((l) => l.trim());

  let documentNumber: string | null = null;
  let expiryDate: string | null = null;
  let holderName: string | null = null;

  for (const line of lines) {
    // Look for document/permit number patterns
    const numMatch = line.match(/(?:document|permit|card)\s*(?:no|number|#)[:\s]*([A-Z0-9]{6,})/i);
    if (numMatch && !documentNumber) {
      documentNumber = numMatch[1];
    }

    // Look for expiry date patterns
    const dateMatch = line.match(/(?:expiry|expires|valid\s*(?:until|to))[:\s]*(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/i);
    if (dateMatch && !expiryDate) {
      expiryDate = dateMatch[1];
    }

    // Look for name patterns
    const nameMatch = line.match(/(?:name|holder)[:\s]*([A-Za-z\s]{3,})/i);
    if (nameMatch && !holderName) {
      holderName = nameMatch[1].trim();
    }
  }

  return {
    documentNumber,
    expiryDate,
    holderName,
    documentType: null,
  };
}

/**
 * Run extraction on a document. Reads the stored file, attempts OCR/MRZ parsing,
 * and stores the extraction result.
 */
export async function runExtraction(documentId: string): Promise<ExtractionResult | null> {
  const document = await db.applicationDocument.findUnique({
    where: { id: documentId },
  });

  if (!document || document.uploadStatus === "DELETED") {
    return null;
  }

  // Update status to PROCESSING
  await db.applicationDocument.update({
    where: { id: documentId },
    data: { extractionStatus: "PROCESSING" },
  });

  try {
    const storage = getStorage();
    const buffer = await storage.read(document.storageKey);
    const text = buffer.toString("utf-8");

    let result: ExtractionResult;

    if (document.documentType === "passport" || document.documentType === "passport_back") {
      const passportData = await parsePassportMrz(text);
      const fieldsFound = Object.values(passportData).filter(Boolean).length;
      const confidence = fieldsFound / 8;

      result = {
        type: "passport",
        data: passportData,
        confidence,
        raw: text.slice(0, 2000),
      };
    } else {
      const residenceData = parseResidenceText(text);
      const fieldsFound = Object.values(residenceData).filter(Boolean).length;
      const confidence = fieldsFound / 4;

      result = {
        type: "residence",
        data: residenceData,
        confidence,
        raw: text.slice(0, 2000),
      };
    }

    // Store extraction
    await db.documentExtraction.create({
      data: {
        documentId,
        extractorVersion: "v1-mrz-text",
        rawPayload: JSON.stringify({ raw: result.raw }),
        normalizedPayload: JSON.stringify(result.data),
        confidence: result.confidence,
      },
    });

    await db.applicationDocument.update({
      where: { id: documentId },
      data: { extractionStatus: "COMPLETED" },
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
