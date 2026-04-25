import { db } from "@/db/client";
import { ScraperConfig, ScraperRunStatus, AppointmentAvailabilitySnapshot } from "@prisma/client";
import Link from "next/link";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";

function DisabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Appointments Tracker Unavailable</h1>
        <p className="mt-2 text-slate-600">
          The appointments tracker is not available on Vercel deployments.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          This feature requires a separate server or self-hosted deployment.
        </p>
        <Link href="/" className="mt-6 inline-block text-primary-600 hover:underline">
          Return Home
        </Link>
      </div>
    </div>
  );
}

interface SnapshotWithConfig extends AppointmentAvailabilitySnapshot {
  scraperConfig?: ScraperConfig | null;
}

async function getAvailabilityData(): Promise<SnapshotWithConfig[]> {
  const snapshots = await db.appointmentAvailabilitySnapshot.findMany({
    take: 50,
    orderBy: { checkedAt: "desc" },
    include: {
      scraperConfig: true,
    },
  });
  return snapshots;
}

async function getActiveRoutes(): Promise<ScraperConfig[]> {
  const configs = await db.scraperConfig.findMany({
    where: { isActive: true },
    orderBy: { checkIntervalMin: "asc" },
  });
  return configs;
}

export default async function AppointmentsPage() {
  if (isVercel) {
    return <DisabledPage />;
  }

  const [snapshots, routes] = await Promise.all([getAvailabilityData(), getActiveRoutes()]);

  const routesWithLatestSnapshot = routes.map((route) => {
    const latest = snapshots.find((s) => s.scraperConfigId === route.id);
    return { ...route, latest };
  });

  const lastUpdated = snapshots[0]?.checkedAt
    ? new Date(snapshots[0].checkedAt).toLocaleString()
    : "Never";

  const groupedByProvider = routesWithLatestSnapshot.reduce(
    (acc, route) => {
      const provider = route.provider;
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(route);
      return acc;
    },
    {} as Record<string, typeof routesWithLatestSnapshot>
  );

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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            VisaRoute
          </Link>
          <Link
            href="/appointments/subscribe"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Subscribe for Alerts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Schengen Visa Appointment Tracker</h1>
          <p className="mt-1 text-slate-600">
            Real-time availability for UK residents applying for Schengen visas. Last updated: {lastUpdated}
          </p>
        </div>

        {routesWithLatestSnapshot.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">No active routes configured. Please set up the scraper first.</p>
            <Link href="/admin" className="mt-4 inline-block text-primary-600 hover:underline">
              Go to Admin
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByProvider).map(([provider, providerRoutes]) => (
              <div key={provider} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">{provider.replace("_", " ")}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {providerRoutes.map((route) => {
                    const latest = route.latest;
                    const hasSlots = latest && latest.slotsCount > 0;
                    const isRecent = latest
                      ? new Date(latest.checkedAt).getTime() > Date.now() - 30 * 60 * 1000
                      : false;

                    return (
                      <div key={route.id} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {route.countrySlug.charAt(0).toUpperCase() + route.countrySlug.slice(1)} from{" "}
                            {route.residenceCountry.toUpperCase()} - {route.city}
                          </p>
                          <p className="text-sm text-slate-500">
                            Check interval: {route.checkIntervalMin} min
                          </p>
                        </div>
                        <div className="text-right">
                          {hasSlots ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                              {latest?.slotsCount} slots
                            </span>
                          ) : isRecent ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                              <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
                              No slots
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                              <span className="mr-1.5 h-2 w-2 rounded-full bg-slate-400"></span>
                              Stale
                            </span>
                          )}
                          {latest && (
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(latest.checkedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">Get Notified</h3>
          <p className="mt-1 text-sm text-blue-700">
            Subscribe to receive instant email alerts when new appointment slots become available.
          </p>
          <Link
            href="/appointments/subscribe"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Subscribe Now
          </Link>
        </div>
      </main>
    </div>
  );
}