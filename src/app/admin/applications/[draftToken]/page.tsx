import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/db/client";
import { getStorage } from "@/server/documents/storage";
import { notFound } from "next/navigation";
import Link from "next/link";
import DownloadAllButton from "./DownloadAllButton";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 text-sm w-44 shrink-0">{label}</span>
      <span className="text-slate-800 text-sm">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

const DOC_LABELS: Record<string, string> = {
  passport: "Passport",
  passport_back: "Passport (back)",
  bank_statement: "Bank statement",
  travel_insurance: "Travel insurance",
  flight_booking: "Flight booking",
  accommodation_proof: "Accommodation",
  cover_letter: "Cover letter",
  employment_letter: "Employment letter",
  payslips: "Payslips",
  tax_returns: "Tax returns",
  business_registration: "Business registration",
  business_bank_statement: "Business bank statement",
  profit_loss: "Profit & loss",
  accountant_letter: "Accountant letter",
  brp: "BRP",
  visa_vignette: "Visa vignette",
  evisa: "eVisa",
  residence_permit: "Residence permit",
};

export default async function AdminApplicationDetail({
  params,
}: {
  params: Promise<{ draftToken: string }>;
}) {
  await requireAdminSession();
  const { draftToken } = await params;

  const application = await db.application.findUnique({
    where: { draftToken },
    include: {
      country: { select: { name: true, code: true } },
      applicantProfile: true,
      travelPlan: true,
      companionGroup: true,
      employmentProfile: true,
      visaHistoryEntries: { orderBy: { sortOrder: "asc" } },
      refusalHistoryEntries: { orderBy: { sortOrder: "asc" } },
      documents: {
        where: { uploadStatus: { not: "DELETED" } },
        orderBy: { createdAt: "asc" },
      },
      checkResults: { orderBy: { createdAt: "desc" }, take: 50 },
      generatedPack: true,
      orders: { include: { serviceTier: { select: { name: true, code: true } } } },
    },
  });

  if (!application) notFound();

  const storage = getStorage();
  const documents = application.documents.map((doc) => ({
    ...doc,
    url: storage.getUrl(doc.storageKey),
  }));

  const applicantName = [
    application.applicantProfile?.firstName,
    application.applicantProfile?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  function fmt(d: Date | string | null | undefined) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-600 transition">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {applicantName || "Unnamed applicant"}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {application.country.name} · {application.status} · {fmt(application.createdAt)}
            </p>
          </div>
        </div>
        <DownloadAllButton draftToken={draftToken} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant */}
          <Section title="Applicant">
            <InfoRow label="Name" value={applicantName || null} />
            <InfoRow label="Email" value={application.applicantProfile?.email} />
            <InfoRow label="Phone" value={application.applicantProfile?.phoneNumber} />
            <InfoRow label="Residence country" value={application.applicantProfile?.countryOfResidence} />
            <InfoRow label="Applying from" value={application.applyingFromCountry} />
            <InfoRow label="Purpose of travel" value={application.applicantProfile?.purposeOfTravel} />
          </Section>

          {/* Travel plan */}
          {application.travelPlan && (
            <Section title="Travel Plan">
              <InfoRow label="Travel start" value={fmt(application.applicantProfile?.travelStartDate)} />
              <InfoRow label="Travel end" value={fmt(application.applicantProfile?.travelEndDate)} />
              <InfoRow label="Trip length" value={application.travelPlan.tripLengthDays ? `${application.travelPlan.tripLengthDays} days` : null} />
              <InfoRow label="Entry city" value={application.travelPlan.entryCity} />
              <InfoRow label="Accommodation" value={application.travelPlan.accommodationType} />
              <InfoRow label="Multi-country" value={application.travelPlan.multiCountryMode} />
            </Section>
          )}

          {/* Employment */}
          {application.employmentProfile && (
            <Section title="Employment">
              <InfoRow label="Status" value={application.employmentProfile.employmentStatus} />
            </Section>
          )}

          {/* Companions */}
          {application.companionGroup?.travellingWithCompanions && (
            <Section title="Travel Companions">
              <InfoRow label="Travelling with others" value={application.companionGroup.travellingWithCompanions} />
              <InfoRow label="Count" value={application.companionGroup.companionsCount?.toString()} />
            </Section>
          )}

          {/* Visa history */}
          {application.visaHistoryEntries.length > 0 && (
            <Section title="Visa History">
              <div className="space-y-1">
                {application.visaHistoryEntries.map((e) => (
                  <div key={e.id} className="text-sm text-slate-700">
                    {e.countryName} {e.yearLabel && <span className="text-slate-400">({e.yearLabel})</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Refusals */}
          {application.refusalHistoryEntries.length > 0 && (
            <Section title="Refusal History">
              <div className="space-y-2">
                {application.refusalHistoryEntries.map((e) => (
                  <div key={e.id} className="text-sm text-slate-700">
                    <span className="font-medium">{e.countryName}</span>
                    {e.yearLabel && <span className="text-slate-400"> · {e.yearLabel}</span>}
                    {e.visaTypeLabel && <span className="text-slate-400"> · {e.visaTypeLabel}</span>}
                    {e.reason && <p className="text-xs text-slate-500 mt-0.5">{e.reason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Documents */}
          <Section title={`Documents (${documents.length})`}>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {DOC_LABELS[doc.documentType] ?? doc.documentType}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doc.originalFileName} · {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium shrink-0 ml-4"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Application meta */}
          <Section title="Application">
            <InfoRow label="Status" value={application.status} />
            <InfoRow label="Step" value={`${application.currentStep}`} />
            <InfoRow label="Completion" value={`${application.completionPercent}%`} />
            <InfoRow label="Submitted" value={fmt(application.submittedAt)} />
            <InfoRow label="Ref" value={application.submissionRef} />
            <InfoRow label="Token" value={<span className="font-mono text-xs text-slate-500">{draftToken}</span>} />
          </Section>

          {/* Orders */}
          {application.orders.length > 0 && (
            <Section title="Orders">
              {application.orders.map((o) => (
                <div key={o.id} className="text-sm text-slate-700 py-2 border-b border-slate-100 last:border-0">
                  <span className="font-medium">{o.serviceTier.name}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${o.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {o.status}
                  </span>
                  {o.paidAt && <p className="text-xs text-slate-400 mt-0.5">Paid {fmt(o.paidAt)}</p>}
                </div>
              ))}
            </Section>
          )}

          {/* Generated pack */}
          {application.generatedPack && (
            <Section title="Generated Pack">
              <InfoRow label="Status" value={application.generatedPack.status} />
              <InfoRow label="Generated" value={fmt(application.generatedPack.generatedAt)} />
              {application.generatedPack.coverLetterText && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Cover letter preview</p>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-6 bg-slate-50 p-2 rounded-lg">
                    {application.generatedPack.coverLetterText}
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* Check results */}
          {application.checkResults.length > 0 && (
            <Section title="Check Results">
              <div className="space-y-2">
                {application.checkResults.slice(0, 10).map((c) => (
                  <div key={c.id} className="text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "pass" ? "bg-green-500" : c.status === "warn" ? "bg-amber-500" : "bg-red-500"}`} />
                      <span className="font-medium text-slate-700">{c.title}</span>
                    </div>
                    {c.detail && <p className="text-slate-400 mt-0.5 pl-3.5">{c.detail}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
