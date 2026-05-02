import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function signOut() {
  "use server";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function NavAuth() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const displayEmail = user.email
      ? user.email.length > 22 ? user.email.slice(0, 22) + "…" : user.email
      : "Account";

    return (
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-slate-600 font-medium" title={user.email}>
          {displayEmail}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-slate-700 font-medium transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
      >
        Log in
      </Link>
      <Link
        href="/auth/signup"
        className="text-sm font-semibold bg-amber-cta hover:bg-amber-cta-hover text-white px-4 py-1.5 rounded-lg transition"
      >
        Sign up
      </Link>
    </div>
  );
}
