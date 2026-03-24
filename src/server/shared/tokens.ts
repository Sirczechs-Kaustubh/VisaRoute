import { randomBytes } from "node:crypto";

export function generateDraftToken() {
  return randomBytes(24).toString("hex");
}
