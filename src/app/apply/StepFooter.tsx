"use client";

export function StepFooter({
  step,
  total,
  onBack,
  onNext,
  nextLabel = "Continue",
  hideNext = false,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  hideNext?: boolean;
}) {
  return (
    <div className="mt-10 border-t border-slate-200 pt-8">
      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s < step
                ? "w-2 bg-primary-500"
                : s === step
                ? "w-6 bg-primary-500"
                : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <svg className="h-4 w-4 transition group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <span className="text-sm font-medium text-slate-400">{step} of {total}</span>

        {hideNext ? (
          <div />
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="group flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
          >
            {nextLabel}
            <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function TipBox({ children, icon = "💡" }: { children: React.ReactNode; icon?: string }) {
  return (
    <div className="rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4">
      <div className="flex gap-3">
        <span className="text-lg leading-none">{icon}</span>
        <p className="text-sm leading-relaxed text-slate-700">{children}</p>
      </div>
    </div>
  );
}
