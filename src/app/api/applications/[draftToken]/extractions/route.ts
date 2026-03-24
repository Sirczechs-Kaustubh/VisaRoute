import { DocumentsService } from "@/server/documents/documents.service";
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
    const extractions = await documentsService.getApplicationExtractions(draftToken);
    return jsonResponse({ extractions });
  } catch (error) {
    return handleRouteError(error);
  }
}
