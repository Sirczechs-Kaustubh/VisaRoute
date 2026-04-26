"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const ACCOMMODATIONS = [
  { id: "hotel", label: "Hotel", desc: "Booking confirmation required", icon: "🏨" },
  { id: "airbnb", label: "Airbnb", desc: "Booking confirmation required", icon: "🏠" },
  { id: "friends", label: "With friends/family", desc: "Invitation letter needed", icon: "👨‍👩‍👧" },
  { id: "hostel", label: "Hostel", desc: "Booking confirmation required", icon: "🛏️" },
];

const ENTRY_CITIES = ["Paris", "Lyon", "Nice", "Marseille", "Bordeaux", "Other"];

export function Step4Travel({
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
  return (
    <>
      <TipBox icon="✈️">
        On a multi-country Schengen trip, you usually apply where you&apos;ll spend the <strong>most nights</strong>.
        List each stop and how long you&apos;ll stay so your itinerary matches what you tell the consulate.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 4 of 13</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Tell us about your travel plan.
      </h1>
      <p className="mt-2 text-slate-600">
        Minimal questions — your answers generate your itinerary and cover letter.
      </p>

      <div className="mt-8 space-y-8">
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
              <span className="font-semibold text-slate-900">Yes — I&apos;ll visit multiple countries</span>
              <span className="mt-0.5 text-sm text-slate-500">We&apos;ll include all countries in your itinerary.</span>
            </button>
            <button
              type="button"
              onClick={() => updateData({ multiCountry: "no" })}
              className={`flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                data.multiCountry === "no" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="font-semibold text-slate-900">No — {countryName} only</span>
              <span className="mt-0.5 text-sm text-slate-500">Single-country itinerary generated.</span>
            </button>
          </div>
        </div>
      </div>

      <StepFooter step={4} total={13} onBack={onBack} onNext={onNext} />
    </>
  );
}
