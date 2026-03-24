/**
 * UK Home Office Share Code verification.
 *
 * The real Gov.uk "View and Prove" API requires a formal integration agreement
 * with the Home Office. For now, this module validates the format and stores
 * the verification request. When the real API is available, swap the
 * `verifyWithHomeOffice` implementation.
 */

export interface SharecodeVerificationResult {
  valid: boolean;
  status: "verified" | "pending_manual" | "invalid_format";
  message: string;
  data?: {
    immigrationStatus?: string;
    expiryDate?: string;
  };
}

/**
 * Validate sharecode format.
 * UK share codes are 9 alphanumeric characters (e.g., "W1234567A").
 */
function isValidSharecodeFormat(code: string): boolean {
  return /^[A-Za-z0-9]{9}$/.test(code.trim());
}

/**
 * Verify a UK Home Office share code.
 * Currently returns "pending_manual" for valid-format codes since
 * the real API integration is not yet available.
 */
export async function verifySharecode(
  shareCode: string,
  dateOfBirth: string,
): Promise<SharecodeVerificationResult> {
  const trimmed = shareCode.trim().toUpperCase();

  if (!isValidSharecodeFormat(trimmed)) {
    return {
      valid: false,
      status: "invalid_format",
      message: "Share code must be 9 alphanumeric characters (e.g., W1234567A)",
    };
  }

  if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
    return {
      valid: false,
      status: "invalid_format",
      message: "A valid date of birth is required for share code verification",
    };
  }

  // In production, this would call the Home Office API:
  // const result = await verifyWithHomeOffice(trimmed, dateOfBirth);
  // For now, accept valid-format codes as "pending manual verification"

  return {
    valid: true,
    status: "pending_manual",
    message: "Share code format accepted. Manual verification will be completed by our team.",
    data: {
      immigrationStatus: undefined,
      expiryDate: undefined,
    },
  };
}
