import { AdminService } from "@/server/admin/admin.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminService = new AdminService();

export async function GET() {
  try {
    const groups = await adminService.listCountryGroups();
    return jsonResponse({ groups });
  } catch (error) {
    return handleRouteError(error);
  }
}
