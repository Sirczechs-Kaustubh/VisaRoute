"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type {
  CountryDetail,
  DocumentRequirementResponse,
  VisaTypeOption,
} from "@/lib/contracts";
import { ApplyingFrom } from "@/components/ApplyingFrom";

const DOCUMENT_ICONS: Record<string, string> = {
  passport: "Passport",
  "application-form": "Form",
  photo: "Photo",
  "travel-insurance": "Insurance",
  itinerary: "Trip",
  accommodation: "Stay",
  financial: "Funds",
  employment: "Work",
  invitation: "Invite",
  "transit-visa": "Transit",
};

const NATIONALITY_OPTIONS = [
  { value: "in", label: "Indian passport (visa required)" },
  { value: "pk", label: "Pakistani passport (visa required)" },
  { value: "bd", label: "Bangladeshi passport (visa required)" },
  { value: "ng", label: "Nigerian passport (visa required)" },
  { value: "other", label: "Other visa-required nationality" },
  { value: "gb", label: "UK passport (visa exempt)" },
  { value: "us", label: "US passport (visa exempt)" },
  { value: "other-exempt", label: "Other visa-exempt nationality" },
];

const VISA_EXEMPT_KEYS = new Set(["gb", "us", "other-exempt"]);

function getNationalityCategory(nationalityKey: string) {
  return VISA_EXEMPT_KEYS.has(nationalityKey) ? "visa-exempt" : "visa-required";
}

function formatRequirementsUrl(slug: string, visaType: string, nationalityCategory: string) {
  const searchParams = new URLSearchParams({
    visaType,
    nationalityCategory,
  });

  return `/api/countries/${slug}/document-requirements?${searchParams.toString()}`;
}

function getVisaByDate(leadWeeks: number) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + Math.max(leadWeeks * 7 + 30, 21));

  return nextDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CountryPageClient({
  country,
  visaTypes,
  initialRequirements,
}: {
  country: CountryDetail;
  visaTypes: VisaTypeOption[];
  initialRequirements: DocumentRequirementResponse | null;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "process">("overview");
  const [visaType, setVisaType] = useState(visaTypes[0]?.code ?? "short-stay-tourism");
  const [nationalityKey, setNationalityKey] = useState("in");
  const [requirements, setRequirements] = useState<DocumentRequirementResponse | null>(
    initialRequirements,
  );
  const [email, setEmail] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [isSubmittingAlert, startAlertSubmission] = useTransition();
  const [isLoadingRequirements, startRequirementsLoad] = useTransition();

  const nationalityCategory = getNationalityCategory(nationalityKey);
  const total = country.visaFeeEur + country.ourServiceFeeEur;
  const visaByDate = getVisaByDate(country.appointmentLeadWeeks);

  useEffect(() => {
    startRequirementsLoad(async () => {
      try {
        const response = await fetch(
          formatRequirementsUrl(country.slug, visaType, nationalityCategory),
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load requirements");
        }

        const payload = (await response.json()) as DocumentRequirementResponse;
        setRequirements(payload);
        setRequirementsError(null);
      } catch {
        setRequirementsError("Could not load document requirements right now.");
      }
    });
  }, [country.slug, nationalityCategory, visaType]);

  const tabs: { id: "overview" | "documents" | "process"; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: "Documents" },
    { id: "process", label: "Process" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
            <span className="text-xl">VisaRoute</span>
          </Link>
          <div className="flex items-center gap-6">
            <ApplyingFrom />
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
              Back to countries
            </Link>
            <Link
              href={`/apply?country=${country.slug}`}
              className="rounded-lg bg-amber-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-cta-hover"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      <div className="relative h-[380px] w-full bg-slate-800 sm:h-[420px]">
        <Image
          src={country.heroImageUrl ?? "https://picsum.photos/seed/fallback-hero/1600/500"}
          alt={country.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            {country.name} Schengen Visa
          </h1>
          <p className="mt-2 max-w-xl text-lg text-white/95 sm:text-xl">
            Easily get your {country.name} Schengen visa from the UK
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-8 max-w-7xl px-4">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:gap-6 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Visa Type</span>
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900"
            >
              {visaTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-sm text-slate-500">Processing</span>
            <p className="font-semibold text-slate-900">
              {country.processingDaysMin}-{country.processingDaysMax} days
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Visa Fee</span>
            <p className="font-semibold text-slate-900">EUR {country.visaFeeEur}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Service Fee</span>
            <p className="font-semibold text-emerald-600">EUR {country.ourServiceFeeEur}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <div className="flex gap-1 border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "border border-slate-200 border-b-white bg-white text-primary-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-8">
                <section>
                  <h2 className="mb-4 w-fit border-b-2 border-primary-500 pb-2 text-xl font-semibold text-slate-900">
                    {country.name} Visa Information
                  </h2>
                  <p className="mb-4 text-slate-600">
                    {country.visaProfile?.overviewText ??
                      `Everything you need to know about the Schengen visa for ${country.name}.`}
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">VISA TYPE</p>
                      <p className="font-medium text-slate-900">Short-term</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">LENGTH OF STAY</p>
                      <p className="font-medium text-slate-900">
                        {country.visaStayLimitDays ?? 90} Days
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">ENTRY</p>
                      <p className="font-medium text-slate-900">
                        {country.entryTypeDefault ?? "Multiple"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">APPROVAL RATE</p>
                      <p className="font-medium text-emerald-600">
                        ~{country.approvalRatePercent ?? 89}%
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 w-fit border-b-2 border-primary-500 pb-2 text-xl font-semibold text-slate-900">
                    {country.name} Visa Insights
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                      <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                        <span className="text-2xl font-bold text-emerald-600">
                          {country.approvalRatePercent ?? 89}%
                        </span>
                      </div>
                      <p className="font-medium text-slate-900">Approval Rate</p>
                      <p className="text-sm text-slate-500">With complete documents</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <p className="mb-1 text-sm text-slate-500">Processing Time</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {country.processingDaysMin}-{country.processingDaysMax} days
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <p className="mb-1 text-sm text-slate-500">Appointment Lead</p>
                      <p className="text-xl font-semibold text-slate-900">
                        ~{country.appointmentLeadWeeks} weeks
                      </p>
                    </div>
                  </div>
                </section>

                <section id="appointments" className="scroll-mt-24">
                  <h2 className="mb-4 w-fit border-b-2 border-primary-500 pb-2 text-xl font-semibold text-slate-900">
                    Check Appointment Availability
                  </h2>
                  <p className="mb-4 text-slate-600">
                    Subscribe to get notified when new visa appointment slots open for {country.name}.
                  </p>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      Medium demand
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                      Next slot in ~{country.appointmentLeadWeeks} weeks
                    </span>
                  </div>
                  {subscriptionMessage ? (
                    <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                      {subscriptionMessage}
                    </p>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        startAlertSubmission(async () => {
                          try {
                            const response = await fetch(
                              `/api/countries/${country.slug}/appointment-alerts`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email, visaType }),
                              },
                            );

                            const payload = (await response.json()) as {
                              subscription?: { created: boolean };
                              error?: { message: string };
                            };

                            if (!response.ok) {
                              throw new Error(payload.error?.message ?? "Could not create alert");
                            }

                            setSubscriptionMessage(
                              payload.subscription?.created
                                ? `We'll email ${email} when new slots open.`
                                : `${email} is already subscribed for updates.`,
                            );
                          } catch (error) {
                            setSubscriptionMessage(
                              error instanceof Error ? error.message : "Could not create alert",
                            );
                          }
                        });
                      }}
                      className="flex flex-wrap gap-2"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="your@email.com"
                        required
                        className="min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingAlert}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmittingAlert ? "Saving..." : "Subscribe to Slot Alerts"}
                      </button>
                    </form>
                  )}
                </section>
              </div>
            )}

            {activeTab === "documents" && (
              <section>
                <h2 className="mb-2 w-fit border-b-2 border-primary-500 pb-2 text-xl font-semibold text-slate-900">
                  Documents Required
                </h2>
                <p className="mb-4 text-slate-600">
                  Select your nationality to see your personalised checklist.
                </p>
                <div className="mb-6 flex flex-wrap gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Nationality
                    </label>
                    <select
                      value={nationalityKey}
                      onChange={(event) => setNationalityKey(event.target.value)}
                      className="min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {NATIONALITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {nationalityCategory === "visa-exempt" && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-slate-700">
                      If you hold a visa-exempt passport, you generally do not need a Schengen visa
                      for short stays. Documents shown below apply if you still need to apply.
                    </p>
                  </div>
                )}
                {requirementsError && (
                  <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    {requirementsError}
                  </p>
                )}
                {isLoadingRequirements && (
                  <p className="mt-4 text-sm text-slate-500">Loading document requirements...</p>
                )}
                {!requirementsError && !isLoadingRequirements && requirements && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {requirements.requirements.map((document) => (
                      <div
                        key={document.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary-200 hover:shadow-md"
                      >
                        <span className="mb-2 block text-sm font-semibold text-primary-700">
                          {DOCUMENT_ICONS[document.code] ?? "Document"}
                        </span>
                        <p className="font-medium text-slate-900">{document.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{document.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "process" && (
              <section>
                <h2 className="mb-2 w-fit border-b-2 border-primary-500 pb-2 text-xl font-semibold text-slate-900">
                  Visa Application Process
                </h2>
                <p className="mb-6 text-slate-600">
                  From the moment you start to receiving your passport back, here is what to expect.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {country.processSteps.map((step, index) => (
                    <div key={step.id} className="rounded-xl border border-slate-200 bg-white p-5">
                      <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {index + 1}
                      </span>
                      <p className="font-medium text-slate-900">{step.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 font-medium text-slate-900">Common rejection reasons</h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {country.rejectionReasons.slice(0, 3).map((reason) => (
                      <li key={reason.id}>- {reason.title}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-xl">
                <h3 className="mb-2 text-lg font-semibold">Get your visa by</h3>
                <p className="mb-4 text-2xl font-bold">{visaByDate}</p>
                <div className="space-y-2 text-sm text-white/90">
                  <p>Visa Fee (Approx EUR {country.visaFeeEur})</p>
                  <p>Service Fee EUR {country.ourServiceFeeEur}</p>
                </div>
                <p className="mt-4 border-t border-white/30 pt-4 text-xl font-bold">
                  Total EUR {total}
                </p>
                <p className="mt-2 text-xs text-white/80">Pay only when you get your appointment</p>
                <Link
                  href={`/apply?country=${country.slug}`}
                  className="mt-4 block w-full rounded-lg bg-amber-cta py-3 text-center font-semibold text-white transition hover:bg-amber-cta-hover"
                >
                  Start Application
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-2 font-medium text-slate-900">Have Queries?</h4>
                <p className="text-sm text-slate-600">Documents, process, price, and timelines.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-2 font-medium text-slate-900">Slot Alert</h4>
                <p className="text-sm text-slate-600">
                  Next slot: ~{country.appointmentLeadWeeks} weeks
                </p>
                <p className="text-xs text-slate-500">Email alerts enabled in phase 1.</p>
                <Link
                  href={`/country/${country.slug}#appointments`}
                  className="mt-2 block rounded-lg border border-primary-600 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
                >
                  Subscribe to alerts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
