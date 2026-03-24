import { ChecksService } from "@/server/checks/checks.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checksService = new ChecksService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const result = await checksService.getChecks(draftToken);
    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const result = await checksService.runChecks(draftToken);
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
