"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";
import { SCHENGEN_APPLYING_FROM_OPTIONS } from "@/lib/applying-from-options";
import { PHONE_DIAL_OPTIONS } from "@/lib/phone-dial-codes";

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
];

export function Step1Intro({
  data,
  updateData,
  onNext,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const dialKnown = PHONE_DIAL_OPTIONS.some((o) => o.dial === data.phoneDialCode);

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 1 of 11</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Hi! Let&apos;s start your application.
        </h1>
      </header>

      <TipBox>
        We use what you enter below to tailor your checklist and application pack—keep it accurate.
      </TipBox>

      <div className="space-y-6">
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Phone number</label>
            <p className="mt-1 text-xs text-slate-500">Choose your country code, then enter your number without the leading zero.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <select
                value={data.phoneDialCode}
                onChange={(e) => updateData({ phoneDialCode: e.target.value })}
                className="w-full shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:max-w-[220px]"
                aria-label="Phone country code"
              >
                {!dialKnown && data.phoneDialCode ? (
                  <option value={data.phoneDialCode}>{data.phoneDialCode}</option>
                ) : null}
                {PHONE_DIAL_OPTIONS.map((o) => (
                  <option key={o.dial} value={o.dial}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={data.phoneNumber}
                onChange={(e) => updateData({ phoneNumber: e.target.value })}
                placeholder="e.g. 98765 43210"
                className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                autoComplete="tel-national"
              />
            </div>
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
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
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
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Purpose of travel</label>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
    </div>
  );
}
