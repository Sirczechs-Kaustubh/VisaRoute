import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminRoot() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");
  redirect("/admin/login");
}
