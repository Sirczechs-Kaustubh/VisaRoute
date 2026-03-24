import { AdminService } from "@/server/admin/admin.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminService = new AdminService();

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  defaultCurrency: z.string().min(1).optional(),
  coverLetterTemplate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const group = await adminService.getCountryGroup(code);
    return jsonResponse({ group });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const group = await adminService.updateCountryGroup(code, parsed);
    return jsonResponse({ group });
  } catch (error) {
    return handleRouteError(error);
  }
}
