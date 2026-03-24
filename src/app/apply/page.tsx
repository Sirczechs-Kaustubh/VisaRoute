import Link from "next/link";
import type { ApplicationDraft, CountryDetail } from "@/lib/contracts";
import { ApplicationsService } from "@/server/applications/applications.service";
import { CountriesService } from "@/server/countries/countries.service";
import { ApplyFlow } from "./ApplyFlow";

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
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-primary-700">
              VisaRoute
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Choose a destination first</h1>
          <p className="text-slate-600 mb-6">
            Select a country from the home page to start your visa application.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-lg bg-amber-cta px-4 py-2 text-sm font-medium text-white hover:bg-amber-cta-hover"
          >
            Browse countries
          </Link>
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
    />
  );
}
