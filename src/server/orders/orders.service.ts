import crypto from "node:crypto";
import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";
import { sendNotificationEmail } from "@/server/notifications/email.service";

export class OrdersService {
  async listServiceTiers() {
    return db.serviceTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, code: true, name: true, description: true,
        priceGBP: true, features: true, sortOrder: true,
      },
    });
  }

  async createOrder(draftToken: string, serviceTierCode: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      select: { id: true, status: true },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const tier = await db.serviceTier.findUnique({
      where: { code: serviceTierCode },
    });

    if (!tier || !tier.isActive) {
      throw new ApiError(404, "SERVICE_TIER_NOT_FOUND", "Service tier not found");
    }

    // Check for existing pending order, return it
    const existing = await db.order.findFirst({
      where: { applicationId: application.id, status: "pending" },
      include: { serviceTier: true },
    });

    if (existing) {
      // Update to new tier if different
      if (existing.serviceTierId !== tier.id) {
        const updated = await db.order.update({
          where: { id: existing.id },
          data: { serviceTierId: tier.id },
          include: { serviceTier: true },
        });
        return mapOrder(updated);
      }
      return mapOrder(existing);
    }

    const order = await db.order.create({
      data: {
        applicationId: application.id,
        serviceTierId: tier.id,
      },
      include: { serviceTier: true },
    });

    return mapOrder(order);
  }

  async confirmPayment(draftToken: string, orderId: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      select: {
        id: true,
        applicantProfile: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { serviceTier: true },
    });

    if (!order || order.applicationId !== application.id) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (order.status === "paid") {
      return mapOrder(order);
    }

    // In production, this would verify with Stripe/payment gateway
    // For now, mark as paid with a generated reference
    const paymentRef = `VR-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: "paid",
        paymentReference: paymentRef,
        paidAt: new Date(),
      },
      include: { serviceTier: true },
    });

    // Send payment confirmation email (non-blocking)
    const email = application.applicantProfile?.email;
    if (email) {
      const name = [application.applicantProfile?.firstName, application.applicantProfile?.lastName]
        .filter(Boolean).join(" ") || "Applicant";
      sendNotificationEmail({
        to: email,
        type: "payment_confirmed",
        applicationId: application.id,
        data: {
          name,
          paymentReference: paymentRef,
          tierName: updated.serviceTier.name,
          amount: updated.serviceTier.priceGBP,
          currency: "GBP",
        },
      }).catch(() => {});
    }

    return mapOrder(updated);
  }

  async getOrders(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      select: { id: true },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const orders = await db.order.findMany({
      where: { applicationId: application.id },
      include: { serviceTier: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(mapOrder);
  }
}

function mapOrder(order: {
  id: string;
  status: string;
  paymentReference: string | null;
  paidAt: Date | null;
  createdAt: Date;
  serviceTier: { code: string; name: string; priceGBP: number };
}) {
  return {
    id: order.id,
    status: order.status,
    paymentReference: order.paymentReference,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    serviceTier: {
      code: order.serviceTier.code,
      name: order.serviceTier.name,
      priceGBP: order.serviceTier.priceGBP,
    },
  };
}
