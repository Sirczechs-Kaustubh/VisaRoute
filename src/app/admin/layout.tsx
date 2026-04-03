import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminNav from "./AdminNav";

export const metadata = { title: "Admin — VisaRoute" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Allow unauthenticated access to the login page only
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
