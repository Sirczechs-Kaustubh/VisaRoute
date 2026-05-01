"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

export function Step13AppointmentBooked({
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
  return (
    <>
      <TipBox icon="📅">
        Add your confirmed appointment details so both you and the customer can track progress.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 11 of 13</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Appointment booked.
      </h1>
      <p className="mt-2 text-slate-600">
        Capture official appointment details from the consulate/visa center.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Date and time of appointment
          </label>
          <input
            type="datetime-local"
            value={data.appointmentDateTime}
            onChange={(e) => updateData({ appointmentDateTime: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            City / country of appointment
          </label>
          <input
            type="text"
            value={data.appointmentLocation}
            onChange={(e) => updateData({ appointmentLocation: e.target.value })}
            placeholder="e.g. Paris, France"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Official application reference number
          </label>
          <input
            type="text"
            value={data.officialApplicationReference}
            onChange={(e) => updateData({ officialApplicationReference: e.target.value })}
            placeholder="Reference from official site"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Notes</label>
          <textarea
            value={data.appointmentNotes}
            onChange={(e) => updateData({ appointmentNotes: e.target.value })}
            rows={4}
            placeholder="Any appointment booking details or comments"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <StepFooter step={11} total={13} onBack={onBack} onNext={onNext} />
    </>
  );
}
