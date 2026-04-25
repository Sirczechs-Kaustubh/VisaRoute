/** Minimum approval rate shown anywhere in the product (per country). */
export const MIN_APPROVAL_RATE_PERCENT = 95;

export function normalizeApprovalRatePercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return MIN_APPROVAL_RATE_PERCENT;
  return Math.min(100, Math.max(MIN_APPROVAL_RATE_PERCENT, value));
}
