"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CountrySummary } from "@/lib/contracts";

const REGIONS = [
  "Western Europe",
  "Nordic",
  "Central/Eastern Europe",
  "Southern Europe",
] as const;

const POPULAR_COUNTRY_SLUGS = ["france", "germany", "spain", "italy", "netherlands"];

export function DestinationSearch({ countries }: { countries: CountrySummary[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [popularOnly, setPopularOnly] = useState(false);
  const [appointmentLead, setAppointmentLead] = useState<string>("all");

  const filteredByRegion = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = countries;

    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }

    if (region !== "all") {
      filtered = filtered.filter((c) => c.region === region);
    }

    if (popularOnly) {
      filtered = filtered.filter((c) => POPULAR_COUNTRY_SLUGS.includes(c.slug));
    }

    if (appointmentLead === "quick") {
      filtered = filtered.filter((c) => c.appointmentLeadWeeks <= 4);
    } else if (appointmentLead === "standard") {
      filtered = filtered.filter((c) => c.appointmentLeadWeeks >= 5);
    }

    const byRegion = REGIONS.map((r) => ({
      region: r,
      countries: filtered.filter((c) => c.region === r),
    })).filter((r) => r.countries.length > 0);
    return byRegion;
  }, [countries, query, region, popularOnly, appointmentLead]);

  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="relative">
          <label htmlFor="destination-search" className="sr-only">
            Search destination
          </label>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            id="destination-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination..."
            className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="region-filter" className="text-sm font-medium text-slate-700">
              Region
            </label>
            <select
              id="region-filter"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Show</span>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setPopularOnly(false)}
                className={`px-3 py-2 text-sm font-medium ${
                  !popularOnly
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPopularOnly(true)}
                className={`px-3 py-2 text-sm font-medium ${
                  popularOnly
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Popular
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="appointment-filter" className="text-sm font-medium text-slate-700">
              Appointment lead
            </label>
            <select
              id="appointment-filter"
              value={appointmentLead}
              onChange={(e) => setAppointmentLead(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="quick">Quick (≤4 weeks)</option>
              <option value="standard">Standard (5–6 weeks)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredByRegion.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">
          No destinations match your filters. Try adjusting your search or filters.
        </p>
      ) : (
        filteredByRegion.map(({ region: r, countries }) => (
          <section key={r} className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {r}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {countries.map((country) => (
                <li key={country.id}>
                  <Link
                    href={`/country/${country.slug}`}
                    className="group block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                  >
                    <div className="relative aspect-[3/2] bg-slate-200">
                      <Image
                        src={country.cardImageUrl ?? "https://picsum.photos/seed/fallback/600/400"}
                        alt={country.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition group-hover:scale-105"
                        unoptimized
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                        aria-hidden
                      />
                      <span className="absolute bottom-3 left-3 text-lg font-semibold text-white drop-shadow-md">
                        {country.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
