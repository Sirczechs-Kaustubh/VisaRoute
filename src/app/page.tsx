import Link from "next/link";
import { ApplyingFrom } from "@/components/ApplyingFrom";
import { DestinationSearch } from "@/components/DestinationSearch";
import { CountriesService } from "@/server/countries/countries.service";

const countriesService = new CountriesService();

export default async function HomePage() {
  const countries = await countriesService.listCountries({});

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            VisaRoute
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
            <ApplyingFrom />
            <p className="hidden text-sm font-medium text-slate-500 sm:block">Schengen visa made simple</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <section className="mb-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl sm:leading-tight">
            Pick a country, understand the process, and get application-ready.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Transparent visa fees, clear service pricing, document guidance, appointment tracking,
            and clear processing timelines – all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#choose-destination"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 hover:shadow-primary-600/30"
            >
              Choose destination
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <span
              className="inline-flex cursor-not-allowed select-none items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-3.5 text-base font-semibold text-slate-500"
              aria-label="Appointment alerts — coming soon"
              title="Coming soon"
            >
              Appointment alerts
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                Coming soon
              </span>
            </span>
          </div>
        </section>

        <section id="choose-destination" className="mb-8">
          <DestinationSearch countries={countries} />
        </section>

        <section
          id="appointment-checker"
          className="mt-16 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/0.04),0_4px_12px_-2px_rgb(0_0_0_/0.06)] sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Appointment alerts</h2>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Coming soon
            </span>
          </div>
          <p className="mt-3 text-slate-600">
            Slot alerts and live appointment availability are not available yet—we are not offering
            appointment notifications at this time. We will enable this here when the feature is
            ready.
          </p>
        </section>

        <p className="mt-12 text-center text-sm font-medium text-slate-500">
          All 29 Schengen countries. One visa allows travel across the area (90 days in 180).
        </p>
      </main>
    </div>
  );
}
