import { PackService } from "@/server/packs/pack.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const packService = new PackService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const pack = await packService.getPack(draftToken);
    return jsonResponse({ pack });
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
    const pack = await packService.generatePack(draftToken);
    return jsonResponse({ pack }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
