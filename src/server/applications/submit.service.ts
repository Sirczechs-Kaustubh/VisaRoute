import crypto from "node:crypto";
import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";
import { sendNotificationEmail } from "@/server/notifications/email.service";

export class SubmitService {
  async submitApplication(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      include: {
        orders: { where: { status: "paid" }, take: 1 },
        applicantProfile: { select: { email: true, firstName: true, lastName: true } },
        country: { select: { name: true } },
      },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    if (application.status === "SUBMITTED" || application.status === "COMPLETED") {
      return {
        applicationId: application.id,
        status: application.status,
        submissionRef: application.submissionRef,
        submittedAt: application.submittedAt,
      };
    }

    // TODO: Re-enable payment check once Stripe integration is complete
    // if (application.orders.length === 0) {
    //   throw new ApiError(400, "PAYMENT_REQUIRED", "Please complete payment before submitting");
    // }

    const submissionRef = `VR-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const updated = await db.application.update({
      where: { draftToken },
      data: {
        status: "COMPLETED",
        operationalStatus: "INITIATED",
        submittedAt: new Date(),
        submissionRef,
      },
    });

    // Send submission confirmation email (non-blocking)
    const email = application.applicantProfile?.email;
    if (email) {
      const name = [application.applicantProfile?.firstName, application.applicantProfile?.lastName]
        .filter(Boolean).join(" ") || "Applicant";
      sendNotificationEmail({
        to: email,
        type: "submission_confirmed",
        applicationId: application.id,
        data: {
          name,
          submissionRef,
          country: application.country.name,
          submittedAt: updated.submittedAt?.toISOString(),
        },
      }).catch(() => {});
    }

    return {
      applicationId: updated.id,
      status: updated.status,
      submissionRef: updated.submissionRef,
      submittedAt: updated.submittedAt,
    };
  }
}
