import { DocumentsService } from "@/server/documents/documents.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentsService = new DocumentsService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string; docId: string }> },
) {
  try {
    const { draftToken, docId } = await params;
    const document = await documentsService.getDocument(draftToken, docId);
    return jsonResponse({ document });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string; docId: string }> },
) {
  try {
    const { draftToken, docId } = await params;
    await documentsService.deleteDocument(draftToken, docId);
    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
