import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const DOCUMENT_TYPES = [
  "passport",
  "passport_back",
  "residence_permit",
  "brp",
  "visa_vignette",
  "evisa",
  "bank_statement",
  "travel_insurance",
  "flight_booking",
  "accommodation_proof",
  "employment_letter",
  "invitation_letter",
  "cover_letter",
  "photo",
  "other",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENTS_PER_APPLICATION = 20;

export const uploadDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
});
