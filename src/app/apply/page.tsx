import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ApplicationDraft, CountryDetail } from "@/lib/contracts";
import { ApplicationsService } from "@/server/applications/applications.service";
import { CountriesService } from "@/server/countries/countries.service";
import { createClient } from "@/utils/supabase/server";
import { ApplyFlow } from "./ApplyFlow";
import { NavAuth } from "@/components/NavAuth";
import { DestinationSearch } from "@/components/DestinationSearch";

interface SearchParams {
  country?: string;
  draft?: string;
}

const countriesService = new CountriesService();
const applicationsService = new ApplicationsService();

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const countrySlug = params?.country ?? null;
  const draftToken = params?.draft ?? null;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent(`/apply${countrySlug ? `?country=${countrySlug}` : ""}${draftToken ? `&draft=${draftToken}` : ""}`);
    redirect(`/auth/login?next=${next}`);
  }

  let initialDraft: ApplicationDraft | null = null;

  if (draftToken) {
    try {
      initialDraft = await applicationsService.getApplicationDraft(draftToken);
    } catch {
      initialDraft = null;
    }
  }

  let country: CountryDetail | null = null;

  if (initialDraft?.country.slug) {
    try {
      country = await countriesService.getCountryBySlug(initialDraft.country.slug);
    } catch {
      country = null;
    }
  } else if (countrySlug) {
    try {
      country = await countriesService.getCountryBySlug(countrySlug);
    } catch {
      country = null;
    }
  }

  if (!country) {
    const countries = await countriesService.listCountries({});
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              VisaRoute
            </Link>
            <NavAuth />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Where are you heading?
            </h1>
            <p className="text-lg text-slate-600">
              Welcome back! To start your visa application, please select your destination country from the list below.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50">
            <DestinationSearch countries={countries} />
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400">
              Can&apos;t find your country? <Link href="/" className="text-primary-600 font-medium hover:underline">Contact our support team</Link> for assistance.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ApplyFlow
      countryName={country.name}
      countrySlug={country.slug}
      visaFeeEur={country.visaFeeEur}
      serviceFeeEur={country.ourServiceFeeEur}
      initialDraft={initialDraft}
      userEmail={user.email ?? undefined}
    />
  );
}
