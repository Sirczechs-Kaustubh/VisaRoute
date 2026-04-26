/** Dial codes for phone input (country / region selector + local number). */
export const PHONE_DIAL_OPTIONS: { dial: string; label: string }[] = [
  { dial: "+91", label: "India (+91)" },
  { dial: "+44", label: "United Kingdom (+44)" },
  { dial: "+1", label: "United States (+1)" },
  { dial: "+971", label: "United Arab Emirates (+971)" },
  { dial: "+880", label: "Bangladesh (+880)" },
  { dial: "+92", label: "Pakistan (+92)" },
  { dial: "+234", label: "Nigeria (+234)" },
  { dial: "+254", label: "Kenya (+254)" },
  { dial: "+27", label: "South Africa (+27)" },
  { dial: "+61", label: "Australia (+61)" },
  { dial: "+86", label: "China (+86)" },
  { dial: "+33", label: "France (+33)" },
  { dial: "+49", label: "Germany (+49)" },
  { dial: "+34", label: "Spain (+34)" },
  { dial: "+39", label: "Italy (+39)" },
];

export const DEFAULT_PHONE_DIAL = "+91";

/** Split a stored full number (e.g. from DB) into dial + local part for editing. */
export function parseStoredPhone(full: string | null | undefined): { dial: string; local: string } {
  const t = full?.trim() ?? "";
  if (!t) return { dial: DEFAULT_PHONE_DIAL, local: "" };
  const m = t.match(/^(\+\d{1,4})\s*(.*)$/);
  if (m) {
    return { dial: m[1], local: m[2].replace(/\s+/g, " ").trim() };
  }
  return { dial: DEFAULT_PHONE_DIAL, local: t };
}

/** Persist as one string (applicantProfile.phoneNumber). */
export function formatPhoneForStorage(dial: string, local: string): string | null {
  const l = local.replace(/[^\d\s-]/g, "").trim();
  if (!l) return null;
  const d = (dial || DEFAULT_PHONE_DIAL).trim();
  return `${d} ${l}`.replace(/\s+/g, " ").trim();
}

export function formatPhoneDisplay(dial: string, local: string): string | null {
  return formatPhoneForStorage(dial, local);
}
