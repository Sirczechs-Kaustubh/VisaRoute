import { DocumentsService } from "@/server/documents/documents.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentsService = new DocumentsService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string; docId: string }> },
) {
  try {
    const { draftToken, docId } = await params;
    const extraction = await documentsService.retriggerExtraction(draftToken, docId);
    return jsonResponse({ extraction });
  } catch (error) {
    return handleRouteError(error);
  }
}
