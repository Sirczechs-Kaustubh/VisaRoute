import type { VisaProvider, ProviderConfig, AppointmentSlot } from "./base";

// BLS International — handles Spain and several other Schengen countries
// Lightest anti-bot protection; use CF /scrape with CSS selectors
export const BLSProvider: VisaProvider = {
  buildUrl({ countrySlug }: ProviderConfig): string {
    const urlMap: Record<string, string> = {
      spain: "https://blsspainuk.com/appointment/",
      germany: "https://software.blsgermanyvisa.com/",
    };
    return urlMap[countrySlug.toLowerCase()] ?? `https://bls${countrySlug}visa.com/`;
  },

  parseSlots(raw: unknown): AppointmentSlot[] {
    const slots: AppointmentSlot[] = [];
    if (!raw || typeof raw !== "object") return slots;

    const data = raw as { result?: Array<{ selector: string; results: Array<{ text?: string }> }> };
    if (!Array.isArray(data.result)) return slots;

    for (const element of data.result) {
      if (!element.results?.length) continue;
      for (const item of element.results) {
        if (item.text?.trim()) {
          const dateMatch = item.text.match(/\d{1,2}[\s/-]\w+[\s/-]\d{4}|\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            slots.push({ date: dateMatch[0] });
          }
        }
      }
    }

    return slots;
  },
};
