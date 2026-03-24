import { ApplicationsService } from "@/server/applications/applications.service";
import { updateApplicationSchema } from "@/server/applications/applications.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationsService = new ApplicationsService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const application = await applicationsService.getApplicationDraft(draftToken);

    return jsonResponse({ application });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const payload = updateApplicationSchema.parse(await request.json());
    const application = await applicationsService.updateApplicationDraft(draftToken, payload);

    return jsonResponse({ application });
  } catch (error) {
    return handleRouteError(error);
  }
}
