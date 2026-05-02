import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "recovery" | "signup" | "email" | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/apply";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const redirectTo = type === "recovery" ? `${origin}/auth/reset-password` : `${origin}${next}`;
      return NextResponse.redirect(redirectTo);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=link_expired`);
}
