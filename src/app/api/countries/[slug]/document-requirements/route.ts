import { RulesService } from "@/server/rules/rules.service";
import { documentRequirementsQuerySchema } from "@/server/rules/rules.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rulesService = new RulesService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const query = documentRequirementsQuerySchema.parse({
      visaType: searchParams.get("visaType") ?? undefined,
      nationalityCategory: searchParams.get("nationalityCategory") ?? undefined,
      countryOfResidence: searchParams.get("countryOfResidence") ?? undefined,
      purposeOfTravel: searchParams.get("purposeOfTravel") ?? undefined,
    });

    const result = await rulesService.getDocumentRequirements(slug, {
      visaTypeCode: query.visaType,
      nationalityCategory: query.nationalityCategory,
      countryOfResidence: query.countryOfResidence,
      purposeOfTravel: query.purposeOfTravel,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
