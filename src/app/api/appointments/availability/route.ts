import { db } from "@/db/client";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { ApiError } from "@/server/shared/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countrySlug = searchParams.get("country");
    const city = searchParams.get("city");

    if (!countrySlug) {
      throw new ApiError(400, "MISSING_PARAM", "country query param is required");
    }

    const country = await db.country.findUnique({
      where: { slug: countrySlug },
      select: { id: true, name: true, slug: true },
    });

    if (!country) {
      throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
    }

    const snapshots = await db.appointmentAvailabilitySnapshot.findMany({
      where: {
        countryId: country.id,
        ...(city ? { city } : {}),
      },
      orderBy: { checkedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        slotsCount: true,
        nextAvailableDate: true,
        checkedAt: true,
        provider: true,
        city: true,
      },
    });

    const latest = snapshots[0] ?? null;

    return jsonResponse({
      country: { slug: country.slug, name: country.name },
      available: latest?.status === "available",
      slotsCount: latest?.slotsCount ?? 0,
      nextAvailableDate: latest?.nextAvailableDate ?? null,
      lastChecked: latest?.checkedAt ?? null,
      history: snapshots,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
