import type { VisaProvider, ProviderConfig, AppointmentSlot } from "./base";

// iDATA — handles German and Italian appointments in Turkey
// Waitlist-based model (track status changes, not calendar slots)
export const IDataProvider: VisaProvider = {
  buildUrl({ countrySlug }: ProviderConfig): string {
    const codeMap: Record<string, string> = {
      germany: "deu",
      italy: "ita",
    };
    const code = codeMap[countrySlug.toLowerCase()] ?? countrySlug.slice(0, 3).toLowerCase();
    return `https://www.idata.com.tr/${code}/en/`;
  },

  parseSlots(raw: unknown): AppointmentSlot[] {
    // iDATA uses waitlist — look for status text indicating availability
    const slots: AppointmentSlot[] = [];
    if (!raw || typeof raw !== "object") return slots;

    const data = raw as {
      available?: boolean;
      slots?: Array<{ date?: string; city?: string }>;
      // Or scrape result format
      result?: Array<{ selector: string; results: Array<{ text?: string }> }>;
    };

    // AI extraction format
    if (data.available && Array.isArray(data.slots)) {
      for (const slot of data.slots) {
        if (slot.date) {
          slots.push({ date: slot.date, city: slot.city });
        }
      }
      return slots;
    }

    // Scrape format — look for waitlist open text
    if (Array.isArray(data.result)) {
      for (const element of data.result) {
        for (const item of element.results ?? []) {
          const text = item.text?.toLowerCase() ?? "";
          if (text.includes("open") || text.includes("available") || text.includes("appointment")) {
            slots.push({ date: new Date().toISOString().slice(0, 10), city: undefined });
          }
        }
      }
    }

    return slots;
  },
};
