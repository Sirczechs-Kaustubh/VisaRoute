import type { VisaProvider, ProviderConfig, AppointmentSlot } from "./base";

// TLScontact handles Schengen appointments for France, Germany, Belgium, Switzerland
// URL pattern: https://{lang}.tlscontact.com/{residence}/{city}/page.php?pid=appointment
export const TLScontactProvider: VisaProvider = {
  buildUrl({ countrySlug, residenceCountry, city }: ProviderConfig): string {
    const langMap: Record<string, string> = {
      france: "fr",
      germany: "de",
      belgium: "be",
      switzerland: "ch",
      netherlands: "nl",
    };
    const lang = langMap[countrySlug.toLowerCase()] ?? countrySlug.slice(0, 2);
    const cityCode = city.slice(0, 3).toUpperCase();
    return `https://${lang}.tlscontact.com/${residenceCountry.toLowerCase()}/${cityCode}/page.php?pid=appointment`;
  },

  parseSlots(raw: unknown): AppointmentSlot[] {
    // CF /scrape returns: { result: [{ selector, results: [{ text, attributes }] }] }
    const slots: AppointmentSlot[] = [];
    if (!raw || typeof raw !== "object") return slots;

    const data = raw as { result?: Array<{ selector: string; results: Array<{ text?: string }> }> };
    if (!Array.isArray(data.result)) return slots;

    for (const element of data.result) {
      if (!element.results?.length) continue;
      for (const item of element.results) {
        if (item.text?.trim()) {
          // Parse date-like strings from calendar elements
          const dateMatch = item.text.match(/\d{1,2}[\s/-]\w+[\s/-]\d{4}|\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            slots.push({ date: dateMatch[0], city: undefined });
          }
        }
      }
    }

    return slots;
  },
};
