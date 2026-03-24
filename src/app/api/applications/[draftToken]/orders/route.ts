import { OrdersService } from "@/server/orders/orders.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ordersService = new OrdersService();

const createOrderSchema = z.object({
  serviceTierCode: z.string().trim().min(1),
});

const confirmPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const orders = await ordersService.getOrders(draftToken);
    return jsonResponse({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const body = await request.json();

    // If orderId is present, this is a payment confirmation
    if (body.orderId) {
      const parsed = confirmPaymentSchema.parse(body);
      const order = await ordersService.confirmPayment(draftToken, parsed.orderId);
      return jsonResponse({ order });
    }

    // Otherwise, create a new order
    const parsed = createOrderSchema.parse(body);
    const order = await ordersService.createOrder(draftToken, parsed.serviceTierCode);
    return jsonResponse({ order }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
