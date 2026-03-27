import type { VisaProvider, ProviderConfig, AppointmentSlot } from "./base";

// VFS Global — largest provider, covers dozens of Schengen countries
// URL pattern: https://visa.vfsglobal.com/{residence}/{lang}/{destination}/
export const VFSGlobalProvider: VisaProvider = {
  buildUrl({ countrySlug, residenceCountry }: ProviderConfig): string {
    const residence = residenceCountry.toLowerCase();
    const destination = countrySlug.toLowerCase();
    return `https://visa.vfsglobal.com/${residence}/en/${destination}/`;
  },

  parseSlots(raw: unknown): AppointmentSlot[] {
    // VFS uses AI /json extraction — raw is already structured JSON
    const slots: AppointmentSlot[] = [];
    if (!raw || typeof raw !== "object") return slots;

    // Handle AI-extracted JSON format: { available, slots: [{ date, time, city, category }] }
    const data = raw as {
      available?: boolean;
      slots?: Array<{ date?: string; time?: string; city?: string; category?: string }>;
    };

    if (!data.available || !Array.isArray(data.slots)) return slots;

    for (const slot of data.slots) {
      if (slot.date) {
        slots.push({
          date: slot.date,
          time: slot.time,
          city: slot.city,
          category: slot.category,
        });
      }
    }

    return slots;
  },
};
