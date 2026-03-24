import { DocumentsService } from "@/server/documents/documents.service";
import { uploadDocumentSchema } from "@/server/documents/documents.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentsService = new DocumentsService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const documents = await documentsService.listDocuments(draftToken);
    return jsonResponse({ documents });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const formData = await request.formData();

    const file = formData.get("file");
    const documentType = formData.get("documentType");

    if (!file || !(file instanceof File)) {
      return jsonResponse(
        { error: { code: "MISSING_FILE", message: "No file provided", details: [] } },
        { status: 400 },
      );
    }

    const parsed = uploadDocumentSchema.parse({ documentType });
    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await documentsService.uploadDocument(draftToken, parsed.documentType, {
      buffer,
      originalFileName: file.name,
      mimeType: file.type,
      size: buffer.length,
    });

    return jsonResponse({ document }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
