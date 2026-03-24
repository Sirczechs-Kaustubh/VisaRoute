import { RulesService } from "@/server/rules/rules.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rulesService = new RulesService();

export async function GET() {
  try {
    const visaTypes = await rulesService.listVisaTypes();

    return jsonResponse({ visaTypes });
  } catch (error) {
    return handleRouteError(error);
  }
}
