import { SubmitService } from "@/server/applications/submit.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitService = new SubmitService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const result = await submitService.submitApplication(draftToken);
    return jsonResponse({ submission: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
