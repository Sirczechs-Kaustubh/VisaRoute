import type { SchengenCountry } from "@/data/countries";
import { MIN_APPROVAL_RATE_PERCENT } from "@/lib/approval-rate";

export function CountryInsights({ country }: { country: SchengenCountry }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Visa data insights</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Processing time</p>
          <p className="text-lg font-semibold text-slate-900">
            {country.processingDaysMin}–{country.processingDaysMax} days
          </p>
          <p className="text-xs text-slate-500 mt-1">From submission to decision</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Approval rate</p>
          <p className="text-lg font-semibold text-slate-900">{MIN_APPROVAL_RATE_PERCENT}%+</p>
          <p className="text-xs text-slate-500 mt-1">With complete documents</p>
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-4">
        Apply well in advance. Peak season can mean longer processing and fewer appointments.
      </p>
    </section>
  );
}
