import { verifySharecode } from "@/server/documents/sharecode";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sharecodeSchema = z.object({
  shareCode: z.string().trim().min(1),
  dateOfBirth: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    await params; // validate route exists
    const body = sharecodeSchema.parse(await request.json());
    const result = await verifySharecode(body.shareCode, body.dateOfBirth);
    return jsonResponse({ verification: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
