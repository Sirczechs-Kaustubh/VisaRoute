export interface AppointmentSlot {
  date: string;
  time?: string;
  city?: string;
  category?: string;
}

export interface ScraperResult {
  available: boolean;
  slots: AppointmentSlot[];
  rawPayload?: string;
}

export interface ProviderConfig {
  countrySlug: string;
  residenceCountry: string;
  city: string;
  selectors?: string;
}

export interface VisaProvider {
  buildUrl(config: ProviderConfig): string;
  parseSlots(raw: unknown): AppointmentSlot[];
}

export function isBlockedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("blocked") ||
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("captcha") ||
    msg.includes("access denied") ||
    msg.includes("bot")
  );
}

export function diffSlots(
  previous: AppointmentSlot[],
  current: AppointmentSlot[],
): AppointmentSlot[] {
  const prevSet = new Set(previous.map((s) => `${s.date}|${s.time ?? ""}|${s.city ?? ""}`));
  return current.filter((s) => !prevSet.has(`${s.date}|${s.time ?? ""}|${s.city ?? ""}`));
}
