import { ApiError } from "@/server/shared/errors";
import { DocumentsRepository } from "./documents.repository";
import { getStorage, generateStorageKey } from "./storage";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_DOCUMENTS_PER_APPLICATION } from "./documents.schemas";
import { runExtraction } from "./extraction";
import { validateBuffer, isValidatable } from "./validation";
import type { ExtractionResult } from "./extraction";
import type { ValidationResult } from "./validation";

const EXTRACTABLE_DOC_TYPES = ["passport", "passport_back", "brp", "visa_vignette", "evisa", "residence_permit"];

function mapDocument(doc: {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadStatus: string;
  extractionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  storageKey: string;
}) {
  const storage = getStorage();
  return {
    id: doc.id,
    documentType: doc.documentType,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    fileSizeBytes: doc.fileSizeBytes,
    uploadStatus: doc.uploadStatus,
    extractionStatus: doc.extractionStatus ?? "NOT_STARTED",
    url: storage.getUrl(doc.storageKey),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class DocumentsService {
  constructor(private readonly repository = new DocumentsRepository()) {}

  async uploadDocument(
    draftToken: string,
    documentType: string,
    file: {
      buffer: Buffer;
      originalFileName: string;
      mimeType: string;
      size: number;
    },
    applicantContext?: {
      applicantName?: string | null;
      travelStartDate?: string | null;
      travelEndDate?: string | null;
    },
  ) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      throw new ApiError(400, "INVALID_FILE_TYPE", `File type '${file.mimeType}' is not allowed. Accepted: JPEG, PNG, PDF, DOCX`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ApiError(400, "FILE_TOO_LARGE", `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    const existingDocs = await this.repository.findDocumentsByApplicationId(application.id);
    if (existingDocs.length >= MAX_DOCUMENTS_PER_APPLICATION) {
      throw new ApiError(400, "TOO_MANY_DOCUMENTS", `Maximum ${MAX_DOCUMENTS_PER_APPLICATION} documents allowed per application`);
    }

    // ── Pre-upload validation for applicable document types ──────────────────
    // Run vision validation BEFORE saving — reject clearly fake/sample documents.
    let validation: ValidationResult | null = null;
    if (isValidatable(documentType)) {
      validation = await validateBuffer(
        file.buffer,
        file.mimeType,
        {
          documentType,
          applicantName: applicantContext?.applicantName ?? null,
          travelStartDate: applicantContext?.travelStartDate ?? null,
          travelEndDate: applicantContext?.travelEndDate ?? null,
        },
      );

      if (validation?.status === "FAILED") {
        const reason = validation.issues.length > 0
          ? validation.issues.join(". ")
          : "Document appears to be a sample, template, or specimen form and cannot be accepted.";
        throw new ApiError(422, "DOCUMENT_VALIDATION_FAILED", reason);
      }
    }

    // For single-instance doc types, replace existing
    const singleInstanceTypes = ["passport", "passport_back", "residence_permit", "brp", "visa_vignette", "evisa", "photo"];
    if (singleInstanceTypes.includes(documentType)) {
      const existing = await this.repository.findExistingDocument(application.id, documentType);
      if (existing) {
        await this.repository.updateDocumentStatus(existing.id, "DELETED");
        const storage = getStorage();
        await storage.delete(existing.storageKey).catch(() => {});
      }
    }

    const storageKey = generateStorageKey(application.id, documentType, file.originalFileName);
    const storage = getStorage();
    await storage.upload(storageKey, file.buffer, file.mimeType);

    const document = await this.repository.createDocument({
      applicationId: application.id,
      documentType,
      storageKey,
      originalFileName: file.originalFileName,
      mimeType: file.mimeType,
      fileSizeBytes: file.size,
    });

    // Store validation result in DocumentExtraction if we have one
    if (validation) {
      await this.repository.createExtraction({
        documentId: document.id,
        extractorVersion: "v2-validation",
        rawPayload: JSON.stringify({ documentType }),
        normalizedPayload: JSON.stringify(validation),
        confidence: validation.confidence,
      }).catch(() => {});
    }

    // Run MRZ/text extraction for passport-type documents
    let extraction: ExtractionResult | null = null;
    if (EXTRACTABLE_DOC_TYPES.includes(documentType)) {
      extraction = await runExtraction(document.id).catch(() => null);
    }

    return {
      ...mapDocument(document),
      validation: validation
        ? { status: validation.status, issues: validation.issues, warnings: validation.warnings }
        : null,
      extraction: extraction
        ? { type: extraction.type, data: extraction.data, confidence: extraction.confidence }
        : null,
    };
  }

  async listDocuments(draftToken: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const documents = await this.repository.findDocumentsByApplicationId(application.id);
    return documents.map(mapDocument);
  }

  async getDocument(draftToken: string, docId: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const document = await this.repository.findDocumentById(docId);
    if (!document || document.applicationId !== application.id || document.uploadStatus === "DELETED") {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
    }

    return mapDocument(document);
  }

  async getDocumentExtractions(draftToken: string, docId: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const document = await this.repository.findDocumentById(docId);
    if (!document || document.applicationId !== application.id || document.uploadStatus === "DELETED") {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
    }

    const extractions = await this.repository.findExtractionsByDocumentId(docId);
    return extractions.map((ext) => ({
      id: ext.id,
      extractorVersion: ext.extractorVersion,
      normalizedPayload: JSON.parse(ext.normalizedPayload),
      confidence: ext.confidence,
      createdAt: ext.createdAt,
    }));
  }

  async getApplicationExtractions(draftToken: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const documents = await this.repository.findDocumentsWithExtractions(application.id);

    return documents
      .filter((doc) => doc.uploadStatus !== "DELETED" && doc.extractions.length > 0)
      .map((doc) => ({
        documentId: doc.id,
        documentType: doc.documentType,
        extractionStatus: doc.extractionStatus,
        extractions: doc.extractions.map((ext) => ({
          id: ext.id,
          normalizedPayload: JSON.parse(ext.normalizedPayload),
          confidence: ext.confidence,
          createdAt: ext.createdAt,
        })),
      }));
  }

  async retriggerExtraction(draftToken: string, docId: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const document = await this.repository.findDocumentById(docId);
    if (!document || document.applicationId !== application.id || document.uploadStatus === "DELETED") {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
    }

    if (!EXTRACTABLE_DOC_TYPES.includes(document.documentType)) {
      throw new ApiError(400, "NOT_EXTRACTABLE", "This document type does not support extraction");
    }

    const extraction = await runExtraction(document.id);
    return extraction
      ? { type: extraction.type, data: extraction.data, confidence: extraction.confidence }
      : null;
  }

  async deleteDocument(draftToken: string, docId: string) {
    const application = await this.repository.findApplicationByDraftToken(draftToken);
    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const document = await this.repository.findDocumentById(docId);
    if (!document || document.applicationId !== application.id || document.uploadStatus === "DELETED") {
      throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
    }

    await this.repository.updateDocumentStatus(docId, "DELETED");

    const storage = getStorage();
    await storage.delete(document.storageKey).catch(() => {});
  }
}
