import { db } from "@/db/client";

export class AppointmentsRepository {
  async findCountryBySlug(slug: string) {
    return db.country.findUnique({
      where: { slug },
    });
  }

  async findVisaTypeByCode(code: string) {
    return db.visaType.findUnique({
      where: { code },
    });
  }

  async findActiveSubscription(countryId: string, email: string, visaTypeId: string | null) {
    return db.appointmentAlertSubscription.findFirst({
      where: {
        countryId,
        email,
        visaTypeId,
        status: "ACTIVE",
      },
    });
  }

  async createSubscription(params: {
    countryId: string;
    email: string;
    visaTypeId: string | null;
    residenceCountry?: string | null;
    city?: string | null;
    provider?: string | null;
  }) {
    return db.appointmentAlertSubscription.create({
      data: {
        countryId: params.countryId,
        email: params.email,
        visaTypeId: params.visaTypeId,
        residenceCountry: params.residenceCountry ?? null,
        city: params.city ?? null,
        provider: params.provider ?? null,
      },
    });
  }

  async cancelSubscriptionById(id: string) {
    return db.appointmentAlertSubscription.update({
      where: { id },
      data: { status: "UNSUBSCRIBED" },
    });
  }

  async cancelSubscriptionByEmail(countryId: string, email: string) {
    return db.appointmentAlertSubscription.updateMany({
      where: { countryId, email, status: "ACTIVE" },
      data: { status: "UNSUBSCRIBED" },
    });
  }
}
