import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const COOKIE_NAME = "vr_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "fallback_dev_secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  return `${payload}:${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length < 3) return null;
  const sig = parts.pop()!;
  const payload = parts.join(":");
  if (sign(payload) !== sig) return null;
  return payload.split(":")[0]; // username
}

export function verifyCredentials(username: string, password: string): boolean {
  const validUser = process.env.ADMIN_USERNAME ?? "anupam";
  const validPass = process.env.ADMIN_PASSWORD ?? "valide@123";
  return username === validUser && password === validPass;
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdminSession(): Promise<string> {
  const username = await getAdminSession();
  if (!username) redirect("/admin/login");
  return username;
}

export function setAdminCookie(token: string): { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: "lax"; maxAge: number; path: string } {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  };
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
