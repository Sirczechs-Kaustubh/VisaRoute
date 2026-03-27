import { sendNotificationEmail } from "@/server/notifications/email.service";
import type { AppointmentSlot } from "./providers/base";
import { db } from "@/db/client";

interface AlertParams {
  configId: string;
  countryId: string;
  countrySlug: string;
  provider: string;
  city: string;
  slots: AppointmentSlot[];
}

export async function sendAppointmentAlert(params: AlertParams): Promise<void> {
  const subscribers = await db.appointmentAlertSubscription.findMany({
    where: {
      countryId: params.countryId,
      status: "ACTIVE",
      OR: [{ provider: null }, { provider: params.provider }],
    },
    include: { country: true },
  });

  if (subscribers.length === 0) return;

  const providerName = formatProvider(params.provider);
  const countryName = subscribers[0]?.country.name ?? params.countrySlug;
  const bookingUrl = buildBookingUrl(params.provider, params.countrySlug);

  for (const subscriber of subscribers) {
    if (subscriber.city && subscriber.city.toLowerCase() !== params.city.toLowerCase()) {
      continue;
    }

    await sendNotificationEmail({
      to: subscriber.email,
      type: "appointment_alert",
      applicationId: `appointment:${params.configId}`,
      data: {
        countryName,
        city: params.city,
        provider: providerName,
        slots: params.slots,
        bookingUrl,
      },
    });
  }
}

function formatProvider(provider: string): string {
  const names: Record<string, string> = {
    tlscontact: "TLScontact",
    vfs_global: "VFS Global",
    bls: "BLS International",
    idata: "iDATA",
  };
  return names[provider.toLowerCase()] ?? provider;
}

function buildBookingUrl(provider: string, countrySlug: string): string {
  const urls: Record<string, Record<string, string>> = {
    tlscontact: {
      france: "https://fr.tlscontact.com/gb/LON/page.php?pid=appointment",
      germany: "https://de.tlscontact.com/gb/LON/page.php?pid=appointment",
    },
    vfs_global: {
      italy: "https://visa.vfsglobal.com/gbr/en/ita/",
      spain: "https://visa.vfsglobal.com/gbr/en/esp/",
    },
    bls: {
      spain: "https://blsspainuk.com/appointment/",
    },
  };
  return urls[provider.toLowerCase()]?.[countrySlug.toLowerCase()] ?? "https://visaroute.com";
}
