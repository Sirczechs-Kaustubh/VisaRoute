import { AppointmentsService } from "@/server/appointments/appointments.service";
import { unsubscribeSchema } from "@/server/appointments/appointments.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new AppointmentsService();

export async function POST(request: Request) {
  try {
    const payload = unsubscribeSchema.parse(await request.json());
    await service.cancelAlertSubscription(payload);

    return jsonResponse({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
