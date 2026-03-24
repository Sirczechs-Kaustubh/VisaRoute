"use client";

import { useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const ACCOMMODATIONS = [
  { id: "hotel", label: "Hotel", desc: "Booking confirmation required", icon: "🏨" },
  { id: "airbnb", label: "Airbnb", desc: "Booking confirmation required", icon: "🏠" },
  { id: "friends", label: "With friends/family", desc: "Invitation letter needed", icon: "👨‍👩‍👧" },
  { id: "hostel", label: "Hostel", desc: "Booking confirmation required", icon: "🛏️" },
];

const ENTRY_CITIES = ["Paris", "Lyon", "Nice", "Marseille", "Bordeaux", "Other"];

export function Step4TripDetails({
  data,
  updateData,
  countryName,
  onNext,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [section, setSection] = useState<"travel" | "companions">("travel");

  return (
    <>
      <TipBox icon="✈️">
        Embassies prefer applications for the country where you&apos;ll spend the most nights &mdash; your entry point should match.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 4 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Trip details.
      </h1>
      <p className="mt-2 text-slate-600">
        Tell us about your accommodation, itinerary and who you&apos;re travelling with.
      </p>

      {/* Section tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setSection("travel")}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "travel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Travel Plan
        </button>
        <button
          type="button"
          onClick={() => setSection("companions")}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "companions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Companions
        </button>
      </div>

      {section === "travel" && (
        <div className="mt-6 space-y-8">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Where will you stay?</label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {ACCOMMODATIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => updateData({ accommodation: data.accommodation === a.id ? "" : a.id })}
                  className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                    data.accommodation === a.id ? "border-primary-500 bg-primary-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="mt-2 font-semibold text-slate-900">{a.label}</span>
                  <span className="mt-0.5 text-xs text-slate-500">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">City of first entry into Schengen</label>
            <select
              value={data.entryCity || ""}
              onChange={(e) => updateData({ entryCity: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select...</option>
              {ENTRY_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Will you visit other Schengen countries?</label>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => updateData({ multiCountry: "yes" })}
                className={`flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                  data.multiCountry === "yes" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="font-semibold text-slate-900">Yes &mdash; I&apos;ll visit multiple countries</span>
                <span className="mt-0.5 text-sm text-slate-500">We&apos;ll include all countries in your itinerary.</span>
              </button>
              <button
                type="button"
                onClick={() => updateData({ multiCountry: "no" })}
                className={`flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                  data.multiCountry === "no" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="font-semibold text-slate-900">No &mdash; {countryName} only</span>
                <span className="mt-0.5 text-sm text-slate-500">Single-country itinerary generated.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {section === "companions" && (
        <div className="mt-6">
          <TipBox icon="👨‍👩‍👧">
            If travelling with children, you&apos;ll need consent letters from both parents if only one is travelling with them.
          </TipBox>

          <div className="mt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Are you travelling with family or friends?
            </label>
            <div className="mt-3 flex gap-4">
              <button
                type="button"
                onClick={() => updateData({ travellingWithCompanions: "yes", companionsCount: data.companionsCount || 1 })}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  data.travellingWithCompanions === "yes" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✓</span>
                <span className="font-semibold text-slate-900">Yes</span>
              </button>
              <button
                type="button"
                onClick={() => updateData({ travellingWithCompanions: "no", companionsCount: 0 })}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  data.travellingWithCompanions === "no" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✗</span>
                <span className="font-semibold text-slate-900">No</span>
              </button>
            </div>

            {data.travellingWithCompanions === "yes" && (
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Number of companions</label>
                <select
                  value={data.companionsCount || 1}
                  onChange={(e) => updateData({ companionsCount: parseInt(e.target.value, 10) })}
                  className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <StepFooter step={4} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
