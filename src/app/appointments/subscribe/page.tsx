"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormData {
  email: string;
  countrySlug: string;
  residenceCountry: string;
  city: string;
}

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    countrySlug: "",
    residenceCountry: "GB",
    city: "London",
  });

  const destinations = [
    { id: "france", name: "France" },
    { id: "germany", name: "Germany" },
    { id: "italy", name: "Italy" },
    { id: "spain", name: "Spain" },
    { id: "netherlands", name: "Netherlands" },
    { id: "belgium", name: "Belgium" },
    { id: "switzerland", name: "Switzerland" },
    { id: "portugal", name: "Portugal" },
    { id: "greece", name: "Greece" },
  ];

  const cities = [
    { id: "London", name: "London" },
    { id: "Manchester", name: "Manchester" },
    { id: "Edinburgh", name: "Edinburgh" },
    { id: "Cardiff", name: "Cardiff" },
    { id: "Belfast", name: "Belfast" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/appointments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          countrySlug: formData.countrySlug,
          residenceCountry: formData.residenceCountry,
          city: formData.city,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              VisaRoute
            </Link>
            <Link href="/appointments" className="text-sm text-slate-600 hover:text-primary-600">
              View Appointments
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-900">Successfully Subscribed!</h2>
            <p className="mt-2 text-green-700">
              You will receive email alerts when visa appointment slots become available for your selected
              route.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/appointments"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                View All Appointments
              </Link>
              <Link href="/" className="text-sm text-green-700 hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            VisaRoute
          </Link>
          <Link href="/appointments" className="text-sm text-slate-600 hover:text-primary-600">
            View Appointments
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">Subscribe for Appointment Alerts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Get instant email notifications when visa appointment slots become available.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="countrySlug" className="block text-sm font-medium text-slate-700">
                Destination Country
              </label>
              <select
                id="countrySlug"
                required
                value={formData.countrySlug}
                onChange={(e) => setFormData({ ...formData, countrySlug: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select destination</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                Preferred City
              </label>
              <select
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            We will only send you alerts when appointments become available. Unsubscribe anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
