import { ApplicationsService } from "@/server/applications/applications.service";
import { createApplicationSchema } from "@/server/applications/applications.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationsService = new ApplicationsService();

export async function POST(request: Request) {
  try {
    const payload = createApplicationSchema.parse(await request.json());
    const application = await applicationsService.createApplicationDraft(payload.countrySlug);

    return jsonResponse({ application }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
