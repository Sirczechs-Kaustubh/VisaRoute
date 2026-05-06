import { ApplicationsService } from "@/server/applications/applications.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationsService = new ApplicationsService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const application = await applicationsService.linkDraftToUser(draftToken, user.id);

    return jsonResponse({ application });
  } catch (error) {
    return handleRouteError(error);
  }
}