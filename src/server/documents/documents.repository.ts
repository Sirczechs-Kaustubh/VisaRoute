import { db } from "@/db/client";
import type { DocumentUploadStatus } from "@prisma/client";

export class DocumentsRepository {
  async findApplicationByDraftToken(draftToken: string) {
    return db.application.findUnique({
      where: { draftToken },
      select: { id: true, status: true },
    });
  }

  async createDocument(params: {
    applicationId: string;
    documentType: string;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    return db.applicationDocument.create({
      data: params,
    });
  }

  async findDocumentsByApplicationId(applicationId: string) {
    return db.applicationDocument.findMany({
      where: {
        applicationId,
        uploadStatus: { not: "DELETED" },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findDocumentById(id: string) {
    return db.applicationDocument.findUnique({
      where: { id },
    });
  }

  async updateDocumentStatus(id: string, uploadStatus: DocumentUploadStatus) {
    return db.applicationDocument.update({
      where: { id },
      data: { uploadStatus },
    });
  }

  async findExistingDocument(applicationId: string, documentType: string) {
    return db.applicationDocument.findFirst({
      where: {
        applicationId,
        documentType,
        uploadStatus: { not: "DELETED" },
      },
    });
  }

  async findExtractionsByDocumentId(documentId: string) {
    return db.documentExtraction.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findDocumentsWithExtractions(applicationId: string) {
    return db.applicationDocument.findMany({
      where: {
        applicationId,
        uploadStatus: { not: "DELETED" },
      },
      include: {
        extractions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
