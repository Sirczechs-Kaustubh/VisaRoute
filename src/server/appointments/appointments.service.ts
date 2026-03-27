import { ApiError } from "@/server/shared/errors";
import { AppointmentsRepository } from "./appointments.repository";

export class AppointmentsService {
  constructor(private readonly repository = new AppointmentsRepository()) {}

  async createAlertSubscription(
    slug: string,
    input: { email: string; visaType?: string; residenceCountry?: string; city?: string; provider?: string },
  ) {
    const country = await this.repository.findCountryBySlug(slug);

    if (!country) {
      throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
    }

    let visaTypeId: string | null = null;

    if (input.visaType) {
      const visaType = await this.repository.findVisaTypeByCode(input.visaType);

      if (!visaType) {
        throw new ApiError(400, "INVALID_VISA_TYPE", "Visa type is invalid");
      }

      visaTypeId = visaType.id;
    }

    const existingSubscription = await this.repository.findActiveSubscription(
      country.id,
      input.email.toLowerCase(),
      visaTypeId,
    );

    if (existingSubscription) {
      return {
        id: existingSubscription.id,
        created: false,
      };
    }

    const subscription = await this.repository.createSubscription({
      countryId: country.id,
      email: input.email.toLowerCase(),
      visaTypeId,
      residenceCountry: input.residenceCountry ?? null,
      city: input.city ?? null,
      provider: input.provider ?? null,
    });

    return {
      id: subscription.id,
      created: true,
    };
  }

  async cancelAlertSubscription(input: { id?: string; email?: string; countrySlug?: string }) {
    if (input.id) {
      await this.repository.cancelSubscriptionById(input.id);
      return;
    }

    if (input.email && input.countrySlug) {
      const country = await this.repository.findCountryBySlug(input.countrySlug);
      if (!country) throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
      await this.repository.cancelSubscriptionByEmail(country.id, input.email.toLowerCase());
      return;
    }

    throw new ApiError(400, "INVALID_INPUT", "Provide id or email+countrySlug");
  }
}
