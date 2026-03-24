import { CountriesService } from "@/server/countries/countries.service";
import { countriesListQuerySchema } from "@/server/countries/countries.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const countriesService = new CountriesService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = countriesListQuerySchema.parse({
      region: searchParams.get("region") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      popularOnly: searchParams.get("popularOnly") ?? undefined,
      appointmentLead: searchParams.get("appointmentLead") ?? undefined,
    });

    const countries = await countriesService.listCountries(query);

    return jsonResponse({ countries });
  } catch (error) {
    return handleRouteError(error);
  }
}
