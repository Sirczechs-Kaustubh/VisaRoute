import { AppointmentsService } from "@/server/appointments/appointments.service";
import { createAppointmentAlertSchema } from "@/server/appointments/appointments.schemas";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const appointmentsService = new AppointmentsService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const payload = createAppointmentAlertSchema.parse(await request.json());
    const result = await appointmentsService.createAlertSubscription(slug, payload);

    return jsonResponse(
      {
        subscription: result,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
