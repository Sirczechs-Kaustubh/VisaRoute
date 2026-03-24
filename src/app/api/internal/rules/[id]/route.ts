import { AdminService } from "@/server/admin/admin.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminService = new AdminService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rule = await adminService.getCheckRule(id);
    return jsonResponse({ rule });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await adminService.deleteCheckRule(id);
    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
