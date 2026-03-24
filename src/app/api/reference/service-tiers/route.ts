import { OrdersService } from "@/server/orders/orders.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ordersService = new OrdersService();

export async function GET() {
  try {
    const tiers = await ordersService.listServiceTiers();
    return jsonResponse({
      tiers: tiers.map((t) => ({
        ...t,
        features: JSON.parse(t.features),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
