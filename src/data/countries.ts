/**
 * Schengen countries data for VisaRoute.
 * As of 2025: 29 countries (25 EU + Iceland, Norway, Switzerland, Liechtenstein).
 */

export interface SchengenCountry {
  id: string;
  name: string;
  slug: string;
  code: string; // ISO 2-letter
  region: "Western Europe" | "Nordic" | "Central/Eastern Europe" | "Southern Europe";
  visaFeeEur: number; // Standard short-stay visa fee (EUR)
  ourServiceFeeEur: number;
  processingDaysMin: number;
  processingDaysMax: number;
  appointmentLeadWeeks: number; // Typical lead time for appointments (weeks)
}

export const SCHENGEN_COUNTRIES: SchengenCountry[] = [
  // Western Europe
  { id: "at", name: "Austria", slug: "austria", code: "AT", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "be", name: "Belgium", slug: "belgium", code: "BE", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "fr", name: "France", slug: "france", code: "FR", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 6 },
  { id: "de", name: "Germany", slug: "germany", code: "DE", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 5 },
  { id: "lu", name: "Luxembourg", slug: "luxembourg", code: "LU", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "nl", name: "Netherlands", slug: "netherlands", code: "NL", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 5 },
  { id: "ch", name: "Switzerland", slug: "switzerland", code: "CH", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  // Nordic
  { id: "dk", name: "Denmark", slug: "denmark", code: "DK", region: "Nordic", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "fi", name: "Finland", slug: "finland", code: "FI", region: "Nordic", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "is", name: "Iceland", slug: "iceland", code: "IS", region: "Nordic", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "no", name: "Norway", slug: "norway", code: "NO", region: "Nordic", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "se", name: "Sweden", slug: "sweden", code: "SE", region: "Nordic", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  // Central/Eastern Europe
  { id: "cz", name: "Czech Republic", slug: "czech-republic", code: "CZ", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "ee", name: "Estonia", slug: "estonia", code: "EE", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "hu", name: "Hungary", slug: "hungary", code: "HU", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "lv", name: "Latvia", slug: "latvia", code: "LV", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "lt", name: "Lithuania", slug: "lithuania", code: "LT", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "pl", name: "Poland", slug: "poland", code: "PL", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "sk", name: "Slovakia", slug: "slovakia", code: "SK", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "si", name: "Slovenia", slug: "slovenia", code: "SI", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  // Southern Europe
  { id: "hr", name: "Croatia", slug: "croatia", code: "HR", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "gr", name: "Greece", slug: "greece", code: "GR", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "it", name: "Italy", slug: "italy", code: "IT", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 6 },
  { id: "mt", name: "Malta", slug: "malta", code: "MT", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "pt", name: "Portugal", slug: "portugal", code: "PT", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
  { id: "es", name: "Spain", slug: "spain", code: "ES", region: "Southern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 6 },
  // Recent additions (air/sea from Jan 2025)
  { id: "bg", name: "Bulgaria", slug: "bulgaria", code: "BG", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "ro", name: "Romania", slug: "romania", code: "RO", region: "Central/Eastern Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 3 },
  { id: "li", name: "Liechtenstein", slug: "liechtenstein", code: "LI", region: "Western Europe", visaFeeEur: 90, ourServiceFeeEur: 99, processingDaysMin: 15, processingDaysMax: 45, appointmentLeadWeeks: 4 },
];

export function getCountryBySlug(slug: string): SchengenCountry | undefined {
  return SCHENGEN_COUNTRIES.find((c) => c.slug === slug);
}

export function getCountryById(id: string): SchengenCountry | undefined {
  return SCHENGEN_COUNTRIES.find((c) => c.id === id);
}

export const REGIONS = [
  "Western Europe",
  "Nordic",
  "Central/Eastern Europe",
  "Southern Europe",
] as const;

/** Use Picsum for reliable placeholder images (Unsplash IDs were returning 404). */
export function getCountryImageUrl(country: SchengenCountry): string {
  return `https://picsum.photos/seed/${country.slug}/600/400`;
}

/** Hero image for country page (wider aspect). */
export function getCountryHeroImageUrl(country: SchengenCountry): string {
  return `https://picsum.photos/seed/${country.slug}-hero/1600/500`;
}
