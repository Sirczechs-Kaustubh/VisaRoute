import { PackService } from "@/server/packs/pack.service";
import { handleRouteError } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const packService = new PackService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const result = await packService.buildBundle(draftToken);
    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
