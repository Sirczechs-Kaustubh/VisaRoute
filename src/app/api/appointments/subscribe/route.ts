import { AppointmentsService } from "@/server/appointments/appointments.service";
import { subscribeSchema } from "@/server/appointments/appointments.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new AppointmentsService();

export async function POST(request: Request) {
  try {
    const payload = subscribeSchema.parse(await request.json());
    const result = await service.createAlertSubscription(payload.countrySlug, {
      email: payload.email,
      visaType: payload.visaType,
      residenceCountry: payload.residenceCountry,
      city: payload.city,
      provider: payload.provider,
    });

    return jsonResponse(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
