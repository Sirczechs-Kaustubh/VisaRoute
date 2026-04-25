"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";
import { SCHENGEN_APPLYING_FROM_OPTIONS } from "@/lib/applying-from-options";

const APPLYING_FROM = [{ value: "", label: "Select country..." }, ...SCHENGEN_APPLYING_FROM_OPTIONS];

const RESIDENCES = [
  { value: "", label: "Select country..." },
  { value: "gb", label: "United Kingdom" },
  { value: "in", label: "India" },
  { value: "us", label: "United States" },
  { value: "ae", label: "UAE" },
  { value: "other", label: "Other" },
];

const PURPOSES = [
  { id: "tourism", label: "Tourism", desc: "Leisure, sightseeing", icon: "🛄" },
  { id: "business", label: "Business", desc: "Meetings, conferences", icon: "💼" },
  { id: "visiting", label: "Visiting family", desc: "Staying with relatives", icon: "👨‍👩‍👧" },
  { id: "study", label: "Study", desc: "Short course or programme", icon: "🎓" },
  { id: "medical", label: "Medical", desc: "Treatment or consultation", icon: "💊" },
  { id: "transit", label: "Transit", desc: "Passing through", icon: "🔄" },
];

export function Step1Intro({
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
      <TipBox>
        Your stated travel purpose determines which documents are required. Be specific – it leads to a stronger cover letter.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 1 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Hi! Let&apos;s start your application.
      </h1>
      <p className="mt-2 text-slate-600">
        Your answers personalise your document checklist and estimate your visa timeline automatically.
      </p>

      <div className="mt-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">First name</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => updateData({ firstName: e.target.value })}
              placeholder="e.g. Rahul"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Last name</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => updateData({ lastName: e.target.value })}
              placeholder="e.g. Sharma"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              placeholder="e.g. you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Phone number</label>
            <input
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => updateData({ phoneNumber: e.target.value })}
              placeholder="e.g. +44 7700 900123"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Where are you applying from?</label>
          <select
            value={data.applyingFromCountry}
            onChange={(e) => updateData({ applyingFromCountry: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {APPLYING_FROM.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Country of residence</label>
          <select
            value={data.countryOfResidence}
            onChange={(e) => updateData({ countryOfResidence: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {RESIDENCES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Purpose of travel</label>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => updateData({ purposeOfTravel: data.purposeOfTravel === p.id ? "" : p.id })}
                className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                  data.purposeOfTravel === p.id
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="mt-2 font-semibold text-slate-900">{p.label}</span>
                <span className="mt-0.5 text-xs text-slate-500">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Travel start date</label>
            <input
              type="date"
              value={data.travelStartDate}
              onChange={(e) => updateData({ travelStartDate: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Travel end date</label>
            <input
              type="date"
              value={data.travelEndDate}
              onChange={(e) => updateData({ travelEndDate: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      <StepFooter step={1} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
