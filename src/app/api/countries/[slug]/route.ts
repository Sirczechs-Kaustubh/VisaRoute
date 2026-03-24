import { CountriesService } from "@/server/countries/countries.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const countriesService = new CountriesService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const country = await countriesService.getCountryBySlug(slug);

    return jsonResponse({ country });
  } catch (error) {
    return handleRouteError(error);
  }
}
