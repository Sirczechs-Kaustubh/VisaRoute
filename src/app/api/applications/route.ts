import { ApplicationsService } from "@/server/applications/applications.service";
import { createApplicationSchema } from "@/server/applications/applications.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationsService = new ApplicationsService();

export async function POST(request: Request) {
  try {
    const payload = createApplicationSchema.parse(await request.json());

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const application = await applicationsService.createApplicationDraft(
      payload.countrySlug,
      user?.id ?? null,
    );

    return jsonResponse({ application }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
