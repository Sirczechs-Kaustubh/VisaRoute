import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/db/client";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:              { label: "Draft",              color: "bg-slate-100 text-slate-600" },
  IN_PROGRESS:        { label: "In Progress",        color: "bg-blue-50 text-blue-700" },
  DOCUMENTS_PENDING:  { label: "Docs Pending",       color: "bg-amber-50 text-amber-700" },
  CHECKS_PENDING:     { label: "Checks Pending",     color: "bg-amber-50 text-amber-700" },
  CHECKS_REVIEWED:    { label: "Checks Reviewed",    color: "bg-sky-50 text-sky-700" },
  PACK_PENDING:       { label: "Pack Pending",        color: "bg-violet-50 text-violet-700" },
  PACK_GENERATED:     { label: "Pack Generated",     color: "bg-violet-50 text-violet-700" },
  APPOINTMENT_PENDING:{ label: "Appt Pending",       color: "bg-orange-50 text-orange-700" },
  COMPLETED:          { label: "Completed",           color: "bg-green-50 text-green-700" },
  SUBMITTED:          { label: "Submitted",           color: "bg-green-50 text-green-700" },
};

export default async function AdminDashboard() {
  await requireAdminSession();

  const applications = await db.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      country: { select: { name: true, code: true } },
      applicantProfile: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { documents: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{applications.length} total</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <p className="text-slate-400 text-sm">No applications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Applicant</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Country</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Docs</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => {
                const name = [app.applicantProfile?.firstName, app.applicantProfile?.lastName]
                  .filter(Boolean)
                  .join(" ") || <span className="text-slate-400 italic">No name yet</span>;
                const statusMeta = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-slate-100 text-slate-600" };

                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{name}</div>
                      {app.applicantProfile?.email && (
                        <div className="text-xs text-slate-400 mt-0.5">{app.applicantProfile.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-700">{app.country.name}</span>
                      <span className="ml-1.5 text-xs text-slate-400">{app.country.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{app._count.documents}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(app.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/applications/${app.draftToken}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
