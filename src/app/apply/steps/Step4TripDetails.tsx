"use client";

import { useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";
import { getEntryCities } from "@/lib/entry-cities";

const ACCOMMODATIONS = [
  { id: "hotel", label: "Hotel", desc: "Booking confirmation required", icon: "🏨" },
  { id: "airbnb", label: "Airbnb", desc: "Booking confirmation required", icon: "🏠" },
  { id: "friends", label: "With friends/family", desc: "Invitation letter needed", icon: "👨‍👩‍👧" },
  { id: "hostel", label: "Hostel", desc: "Booking confirmation required", icon: "🛏️" },
];


function normalizeCompanionMembers(data: ApplicationData, count: number) {
  const size = Math.max(0, count);
  return Array.from({ length: size }, (_, idx) => ({
    name: data.companionMembers[idx]?.name ?? "",
    relationship: data.companionMembers[idx]?.relationship ?? "",
    passportNumber: data.companionMembers[idx]?.passportNumber ?? "",
  }));
}

export function Step4TripDetails({
  data,
  updateData,
  countryName,
  countrySlug,
  onNext,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  countrySlug: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const ENTRY_CITIES = getEntryCities(countrySlug);
  const [section, setSection] = useState<"travel" | "companions">("travel");
  const [stepError, setStepError] = useState<string | null>(null);

  const multiDetailsComplete =
    data.multiCountry !== "yes" ||
    (Boolean(data.otherSchengenCountries?.trim()) &&
      Boolean(data.nightsInVisaDestination?.trim()) &&
      !Number.isNaN(parseInt(data.nightsInVisaDestination, 10)) &&
      parseInt(data.nightsInVisaDestination, 10) > 0 &&
      Boolean(data.schengenFirstEntryDate?.trim()));

  const travelComplete =
    Boolean(data.accommodation?.trim()) &&
    Boolean(data.entryCity?.trim()) &&
    Boolean(data.multiCountry?.trim()) &&
    multiDetailsComplete;

  const companionsChoice = data.travellingWithCompanions?.trim().toLowerCase();
  const companionsAnswered = companionsChoice === "yes" || companionsChoice === "no";

  function tryContinue() {
    setStepError(null);

    if (!travelComplete) {
      setStepError(
        data.multiCountry === "yes" && !multiDetailsComplete
          ? "For multiple Schengen countries, list the other countries, nights in your visa country, and your first Schengen entry date."
          : "Finish the Travel Plan tab: where you’ll stay, your first Schengen entry city, and whether you’ll visit other Schengen countries.",
      );
      setSection("travel");
      return;
    }

    if (!companionsAnswered) {
      setStepError("On the Companions tab, choose Yes or No for travelling with others.");
      setSection("companions");
      return;
    }

    if (companionsChoice === "yes" && (!data.companionsCount || data.companionsCount < 1)) {
      setStepError("Select how many companions are travelling with you.");
      setSection("companions");
      return;
    }

    onNext();
  }

  return (
    <>
      <TipBox icon="✈️">
        On a multi-country Schengen trip, you usually apply where you&apos;ll spend the <strong>most nights</strong>.
        List each stop and how long you&apos;ll stay so your itinerary matches what you tell the consulate.
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
          onClick={() => {
            setSection("travel");
            setStepError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "travel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Travel Plan
            {travelComplete ? (
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
            ) : (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                To do
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSection("companions");
            setStepError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "companions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Companions
            {companionsAnswered ? (
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
            ) : (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                To do
              </span>
            )}
          </span>
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
                onClick={() =>
                  updateData({
                    multiCountry: "yes",
                    ...(!data.schengenFirstEntryDate.trim() && data.travelStartDate
                      ? { schengenFirstEntryDate: data.travelStartDate }
                      : {}),
                  })
                }
                className={`flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                  data.multiCountry === "yes" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="font-semibold text-slate-900">Yes &mdash; I&apos;ll visit multiple countries</span>
                <span className="mt-0.5 text-sm text-slate-500">Tell us each stop and timing below.</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateData({
                    multiCountry: "no",
                    otherSchengenCountries: "",
                    nightsInVisaDestination: "",
                    schengenFirstEntryDate: "",
                  })
                }
                className={`flex w-full flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                  data.multiCountry === "no" ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="font-semibold text-slate-900">No &mdash; {countryName} only</span>
                <span className="mt-0.5 text-sm text-slate-500">Single-country itinerary generated.</span>
              </button>
            </div>

            {data.multiCountry === "yes" && (
              <div className="mt-6 space-y-6 rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 sm:p-5">
                <p className="text-sm font-medium text-amber-950">
                  <span className="font-semibold">Important:</span> apply for a visa from the Schengen country where you
                  will stay the <span className="font-semibold">longest</span>. That should match the destination you
                  chose for this application ({countryName}).
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Other Schengen countries &amp; how long
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    List each other country and roughly how many nights (e.g. &quot;Germany 3 nights, Italy 2&quot;).
                  </p>
                  <textarea
                    value={data.otherSchengenCountries}
                    onChange={(e) => updateData({ otherSchengenCountries: e.target.value })}
                    rows={3}
                    placeholder={`e.g. Germany — 3 nights, Italy — 2 nights (besides ${countryName})`}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Nights in {countryName} (this application)
                    </label>
                    <p className="mt-1 text-xs text-slate-500">Must be your longest stay if this is your main destination visa.</p>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      inputMode="numeric"
                      value={data.nightsInVisaDestination}
                      onChange={(e) => updateData({ nightsInVisaDestination: e.target.value })}
                      placeholder="e.g. 5"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      First day in the Schengen area
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Usually the same as your trip start in Step 1 if you fly straight in—adjust if you enter later.
                    </p>
                    <input
                      type="date"
                      value={data.schengenFirstEntryDate}
                      min={data.travelStartDate || undefined}
                      max={data.travelEndDate || undefined}
                      onChange={(e) => updateData({ schengenFirstEntryDate: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
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
                onClick={() => {
                  const count = data.companionsCount || 1;
                  updateData({
                    travellingWithCompanions: "yes",
                    companionsCount: count,
                    companionMembers: normalizeCompanionMembers(data, count),
                  });
                }}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  companionsChoice === "yes" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✓</span>
                <span className="font-semibold text-slate-900">Yes</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateData({
                    travellingWithCompanions: "no",
                    companionsCount: 0,
                    companionMembers: [],
                  })
                }
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  companionsChoice === "no" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✗</span>
                <span className="font-semibold text-slate-900">No</span>
              </button>
            </div>

            {companionsChoice === "yes" && (
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Number of companions</label>
                <select
                  value={data.companionsCount || 1}
                  onChange={(e) => {
                    const count = parseInt(e.target.value, 10);
                    updateData({
                      companionsCount: count,
                      companionMembers: normalizeCompanionMembers(data, count),
                    });
                  }}
                  className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                  ))}
                </select>

                <div className="mt-5 space-y-4">
                  {Array.from({ length: data.companionsCount || 0 }, (_, idx) => {
                    const member = data.companionMembers[idx] ?? {
                      name: "",
                      relationship: "",
                      passportNumber: "",
                    };
                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Person {idx + 1}</p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                              Name
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                const next = normalizeCompanionMembers(data, data.companionsCount || 0);
                                next[idx] = { ...next[idx], name: e.target.value };
                                updateData({ companionMembers: next });
                              }}
                              placeholder="e.g. Priya Sharma"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                              Relationship
                            </label>
                            <input
                              type="text"
                              value={member.relationship}
                              onChange={(e) => {
                                const next = normalizeCompanionMembers(data, data.companionsCount || 0);
                                next[idx] = { ...next[idx], relationship: e.target.value };
                                updateData({ companionMembers: next });
                              }}
                              placeholder="e.g. Spouse, Brother, Friend"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                              Passport number
                            </label>
                            <input
                              type="text"
                              value={member.passportNumber}
                              onChange={(e) => {
                                const next = normalizeCompanionMembers(data, data.companionsCount || 0);
                                next[idx] = { ...next[idx], passportNumber: e.target.value };
                                updateData({ companionMembers: next });
                              }}
                              placeholder="e.g. M1234567"
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stepError && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {stepError}
        </div>
      )}

      {!travelComplete || !companionsAnswered ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-medium text-slate-800">Checklist before Continue</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {!travelComplete && <li>Open Travel Plan and complete stay type, entry city, and other countries.</li>}
            {!companionsAnswered && <li>Open Companions and choose Yes or No (traveling solo is fine — pick No).</li>}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs font-medium text-emerald-700">Travel plan and companions are complete — you can continue.</p>
      )}

      <StepFooter step={4} total={11} onBack={onBack} onNext={tryContinue} />
    </>
  );
}
