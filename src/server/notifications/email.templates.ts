interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = "#4f46e5";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr><td style="background:${BRAND_COLOR};padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">VisaRoute</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px">${title}</h2>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center">
            VisaRoute &mdash; Your visa application platform
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6">${text}</p>`;
}

function highlight(label: string, value: string): string {
  return `<div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:0 0 16px">
    <span style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:.5px">${label}</span>
    <div style="color:#1e293b;font-size:20px;font-weight:700;margin-top:4px">${value}</div>
  </div>`;
}

// ─── Submission Confirmed ───────────────────────────────

export function buildSubmissionEmail(data: Record<string, unknown>): EmailContent {
  const name = (data.name as string) || "Applicant";
  const ref = (data.submissionRef as string) || "N/A";
  const country = (data.country as string) || "";
  const submittedAt = data.submittedAt
    ? new Date(data.submittedAt as string).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "Today";

  const body = [
    p(`Hi ${name},`),
    p(`Your visa application for <strong>${country}</strong> has been submitted successfully.`),
    highlight("Reference Number", ref),
    p(`Submitted on: <strong>${submittedAt}</strong>`),
    p("Keep this reference number safe &mdash; you'll need it to track your application status."),
    p("What happens next:"),
    `<ul style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 16px">
      <li>Our team will review your application</li>
      <li>You'll be contacted if any additional documents are needed</li>
      <li>We'll guide you through the appointment booking process</li>
    </ul>`,
  ].join("");

  const text = `Hi ${name},\n\nYour visa application for ${country} has been submitted.\n\nReference: ${ref}\nSubmitted: ${submittedAt}\n\nKeep this reference number safe.\n\n— VisaRoute`;

  return {
    subject: `Application Submitted — ${ref}`,
    html: layout("Application Submitted", body),
    text,
  };
}

// ─── Payment Confirmed ──────────────────────────────────

export function buildPaymentEmail(data: Record<string, unknown>): EmailContent {
  const name = (data.name as string) || "Applicant";
  const paymentRef = (data.paymentReference as string) || "N/A";
  const tierName = (data.tierName as string) || "Service";
  const amount = (data.amount as number) ?? 0;
  const currency = (data.currency as string) || "GBP";

  const body = [
    p(`Hi ${name},`),
    p(`Your payment has been confirmed. Here are the details:`),
    highlight("Payment Reference", paymentRef),
    `<table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Service</td>
          <td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">${tierName}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Amount</td>
          <td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right">${currency === "GBP" ? "£" : "€"}${(amount / 100).toFixed(2)}</td></tr>
    </table>`,
    p("You can now proceed to submit your application."),
  ].join("");

  const text = `Hi ${name},\n\nPayment confirmed.\n\nReference: ${paymentRef}\nService: ${tierName}\nAmount: ${currency === "GBP" ? "£" : "€"}${(amount / 100).toFixed(2)}\n\nYou can now submit your application.\n\n— VisaRoute`;

  return {
    subject: `Payment Confirmed — ${paymentRef}`,
    html: layout("Payment Confirmed", body),
    text,
  };
}

// ─── Pack Ready ─────────────────────────────────────────

export function buildPackReadyEmail(data: Record<string, unknown>): EmailContent {
  const name = (data.name as string) || "Applicant";
  const country = (data.country as string) || "";
  const draftToken = (data.draftToken as string) || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const resumeUrl = `${baseUrl}/apply?draft=${draftToken}`;

  const body = [
    p(`Hi ${name},`),
    p(`Your visa application pack for <strong>${country}</strong> is ready. The following documents have been generated:`),
    `<ul style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 16px">
      <li><strong>Cover Letter</strong> &mdash; personalised for your application</li>
      <li><strong>Document Checklist</strong> &mdash; all your uploaded documents verified</li>
      <li><strong>Application Summary</strong> &mdash; complete overview of your details</li>
    </ul>`,
    p("All documents are available as editable Word (.docx) files so you can make any final adjustments."),
    `<div style="text-align:center;margin:24px 0">
      <a href="${resumeUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
        View & Download Documents
      </a>
    </div>`,
  ].join("");

  const text = `Hi ${name},\n\nYour visa pack for ${country} is ready:\n- Cover Letter\n- Document Checklist\n- Application Summary\n\nView your documents: ${resumeUrl}\n\n— VisaRoute`;

  return {
    subject: `Your Visa Pack is Ready — ${country}`,
    html: layout("Your Visa Pack is Ready", body),
    text,
  };
}
