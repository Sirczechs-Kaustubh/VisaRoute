import { z } from "zod";
import { db } from "@/db/client";
import { jsonResponse, handleRouteError } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  country: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await db.contactRequest.create({ data: body });
    return jsonResponse({ ok: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
