import { AdminService } from "@/server/admin/admin.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminService = new AdminService();

const upsertSchema = z.object({
  ruleCode: z.string().trim().min(1),
  countryGroupCode: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const groupCode = url.searchParams.get("countryGroupCode") ?? undefined;
    const rules = await adminService.listCheckRules(groupCode);
    return jsonResponse({
      rules: rules.map((r) => ({
        ...r,
        parameters: r.parameters ? JSON.parse(r.parameters) : null,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = upsertSchema.parse(body);
    const rule = await adminService.upsertCheckRule(parsed);
    return jsonResponse({ rule }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
