import { Resend } from "resend";
import { db } from "@/db/client";
import {
  buildSubmissionEmail,
  buildPaymentEmail,
  buildPackReadyEmail,
} from "./email.templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "VisaRoute <noreply@visaroute.com>";

export type EmailType = "submission_confirmed" | "payment_confirmed" | "pack_ready";

interface SendEmailOptions {
  to: string;
  type: EmailType;
  applicationId: string;
  data: Record<string, unknown>;
}

async function logEmail(
  opts: SendEmailOptions & { status: "sent" | "failed"; error?: string },
) {
  try {
    await db.emailLog.create({
      data: {
        applicationId: opts.applicationId,
        emailType: opts.type,
        recipientEmail: opts.to,
        status: opts.status,
        error: opts.error ?? null,
        sentAt: opts.status === "sent" ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("Failed to log email:", err);
  }
}

function buildEmail(type: EmailType, data: Record<string, unknown>) {
  switch (type) {
    case "submission_confirmed":
      return buildSubmissionEmail(data);
    case "payment_confirmed":
      return buildPaymentEmail(data);
    case "pack_ready":
      return buildPackReadyEmail(data);
  }
}

export async function sendNotificationEmail(opts: SendEmailOptions): Promise<void> {
  const { subject, html, text } = buildEmail(opts.type, opts.data);

  if (!resend) {
    console.log(`[Email] (no RESEND_API_KEY) Would send "${subject}" to ${opts.to}`);
    console.log(`[Email] Preview:\n${text}`);
    await logEmail({ ...opts, status: "sent", error: "dry-run: no API key" });
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: opts.to,
      subject,
      html,
      text,
    });
    await logEmail({ ...opts, status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Email] Failed to send "${subject}" to ${opts.to}:`, message);
    await logEmail({ ...opts, status: "failed", error: message });
  }
}
