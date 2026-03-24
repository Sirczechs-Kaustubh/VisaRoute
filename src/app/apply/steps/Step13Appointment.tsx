"use client";

import { useEffect, useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { TipBox } from "../StepFooter";

interface ServiceTier {
  id: string;
  code: string;
  name: string;
  description: string;
  priceGBP: number;
  features: string[];
}

interface OrderData {
  id: string;
  status: string;
  paymentReference: string | null;
  paidAt: string | null;
  serviceTier: { code: string; name: string; priceGBP: number };
}

interface SubmissionData {
  applicationId: string;
  status: string;
  submissionRef: string;
  submittedAt: string;
}

export function Step13Appointment({
  data,
  countryName,
  countrySlug,
  visaFeeEur,
  serviceFeeEur,
  onBack,
  draftToken,
}: {
  data: ApplicationData;
  countryName: string;
  countrySlug: string;
  visaFeeEur: number;
  serviceFeeEur: number;
  onBack: () => void;
  draftToken?: string | null;
}) {
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tiers and existing orders on mount
  useEffect(() => {
    if (!draftToken) { setLoading(false); return; }

    Promise.all([
      fetch("/api/reference/service-tiers").then((r) => r.json()),
      fetch(`/api/applications/${draftToken}/orders`).then((r) => r.json()),
    ])
      .then(([tiersData, ordersData]) => {
        if (tiersData.tiers) setTiers(tiersData.tiers);
        const orders = ordersData.orders as OrderData[] | undefined;
        if (orders && orders.length > 0) {
          const paidOrder = orders.find((o) => o.status === "paid");
          const pendingOrder = orders.find((o) => o.status === "pending");
          if (paidOrder) {
            setOrder(paidOrder);
            setSelectedTier(paidOrder.serviceTier.code);
          } else if (pendingOrder) {
            setOrder(pendingOrder);
            setSelectedTier(pendingOrder.serviceTier.code);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [draftToken]);

  async function handleSelectTier(tierCode: string) {
    if (!draftToken) return;
    setSelectedTier(tierCode);
    setError(null);
    setProcessing(true);
    try {
      const res = await fetch(`/api/applications/${draftToken}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceTierCode: tierCode }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to create order");
        return;
      }
      setOrder(body.order);
    } catch {
      setError("Failed to create order");
    } finally {
      setProcessing(false);
    }
  }

  async function handlePayment() {
    if (!draftToken || !order) return;
    setProcessing(true);
    setError(null);
    try {
      // Confirm payment (placeholder — in production this would integrate with Stripe)
      const res = await fetch(`/api/applications/${draftToken}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Payment failed");
        return;
      }
      setOrder(body.order);
    } catch {
      setError("Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmit() {
    if (!draftToken) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${draftToken}/submit`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Submission failed");
        return;
      }
      setSubmission(body.submission);
    } catch {
      setError("Submission failed");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  // Submitted state
  if (submission) {
    return (
      <>
        <div className="py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Application submitted!</h1>
          <p className="mt-2 text-slate-600">
            Your {countryName} Schengen visa application has been submitted successfully.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase text-slate-500">Reference number</p>
            <p className="mt-1 text-lg font-bold tracking-wider text-slate-900">{submission.submissionRef}</p>
            <p className="mt-3 text-xs text-slate-500">
              Submitted {new Date(submission.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Our team will contact you within 2 hours to begin processing your application.
          </p>
        </div>
      </>
    );
  }

  const isPaid = order?.status === "paid";

  return (
    <>
      <TipBox icon="📅">
        Apply at least 3–4 weeks before travel. Peak summer months (Jun–Aug) see the slowest appointment availability.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 11 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Choose your service & submit.
      </h1>
      <p className="mt-2 text-slate-600">
        Select a service tier, complete payment, and submit your application.
      </p>

      {/* Service tiers */}
      <div className="mt-8 space-y-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.code;
          const isCurrentOrder = order?.serviceTier.code === tier.code;
          return (
            <button
              key={tier.code}
              type="button"
              onClick={() => !isPaid && handleSelectTier(tier.code)}
              disabled={processing || isPaid}
              className={`w-full rounded-xl border-2 p-5 text-left transition ${
                isSelected
                  ? "border-primary-500 bg-primary-50/50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${isPaid && !isCurrentOrder ? "opacity-40" : ""} disabled:cursor-not-allowed`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{tier.name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{tier.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                  tier.priceGBP === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {tier.priceGBP === 0 ? "Free" : `£${(tier.priceGBP / 100).toFixed(0)}`}
                </span>
              </div>
              <ul className="mt-3 space-y-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Payment / Submit section */}
      {order && !isPaid && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{order.serviceTier.name} tier selected</p>
              <p className="text-sm text-slate-500">
                {order.serviceTier.priceGBP === 0
                  ? "No payment required"
                  : `Total: £${(order.serviceTier.priceGBP / 100).toFixed(0)}`
                }
              </p>
            </div>
            <button
              type="button"
              onClick={handlePayment}
              disabled={processing}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {processing ? "Processing..." : order.serviceTier.priceGBP === 0 ? "Confirm selection" : "Pay now"}
            </button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <span>✓</span> Payment confirmed
              {order.paymentReference && (
                <span className="text-emerald-600"> — Ref: {order.paymentReference}</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {processing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit application
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-8">
        <button onClick={onBack} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          ← Back
        </button>
        <span className="text-sm font-medium text-slate-700">11 / 11</span>
        <div />
      </div>
    </>
  );
}
