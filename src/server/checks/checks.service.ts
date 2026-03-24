import crypto from "node:crypto";
import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";
import { ALL_CHECKS } from "./rules";
import type { CheckContext, CheckOutput, RuleParams } from "./checks.types";
import { isAIEnabled, generateText } from "@/server/ai/openrouter";
import { DOCUMENT_CHECK_SYSTEM_PROMPT, buildDocumentCheckPrompt } from "@/server/ai/prompts";

export class ChecksService {
  async runChecks(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      include: {
        country: { select: { countryGroupCode: true, name: true } },
        applicantProfile: true,
        travelPlan: true,
        companionGroup: true,
        employmentProfile: true,
        documents: {
          where: { uploadStatus: { not: "DELETED" } },
          include: {
            extractions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        visaHistoryEntries: true,
        refusalHistoryEntries: true,
      },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    // Load configurable check rules for this country group
    const countryGroupCode = application.country.countryGroupCode;
    const ruleParams = await this.loadRuleParams(countryGroupCode);

    const ctx: CheckContext = {
      application: {
        id: application.id,
        applyingFromCountry: application.applyingFromCountry,
        countryGroupCode,
        applicantProfile: application.applicantProfile,
        travelPlan: application.travelPlan,
        companionGroup: application.companionGroup,
        employmentProfile: application.employmentProfile,
      },
      documents: application.documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        uploadStatus: doc.uploadStatus,
        extractionStatus: doc.extractionStatus,
        extractions: doc.extractions.map((ext) => ({
          normalizedPayload: ext.normalizedPayload,
          confidence: ext.confidence,
        })),
      })),
      requiredDocTypes: [],
      ruleParams,
    };

    // Run deterministic checks
    const results: CheckOutput[] = ALL_CHECKS.map((check) => check(ctx));

    // Run AI-powered advisory check (non-blocking — failures don't affect the flow)
    const aiResults = await this.runAICheck(application, ctx);
    results.push(...aiResults);

    const runId = crypto.randomBytes(8).toString("hex");

    // Delete previous check results for this application
    await db.checkResult.deleteMany({
      where: { applicationId: application.id },
    });

    // Store new results
    await db.checkResult.createMany({
      data: results.map((r) => ({
        applicationId: application.id,
        runId,
        checkCode: r.checkCode,
        status: r.status,
        title: r.title,
        detail: r.detail,
        subDetail: r.subDetail,
        severity: r.severity,
      })),
    });

    // Update application status (only deterministic checks affect status)
    const deterministicResults = results.filter((r) => !r.checkCode.startsWith("ai_"));
    const hasFails = deterministicResults.some((r) => r.status === "fail");
    const allPass = deterministicResults.every((r) => r.status === "pass");
    await db.application.update({
      where: { id: application.id },
      data: {
        status: allPass ? "CHECKS_REVIEWED" : hasFails ? "CHECKS_PENDING" : "CHECKS_REVIEWED",
      },
    });

    return {
      runId,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.status === "pass").length,
        warnings: results.filter((r) => r.status === "warn").length,
        failed: results.filter((r) => r.status === "fail").length,
      },
      checks: results,
    };
  }

  async getChecks(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      select: { id: true },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const results = await db.checkResult.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
    });

    if (results.length === 0) {
      return { runId: null, summary: { total: 0, passed: 0, warnings: 0, failed: 0 }, checks: [] };
    }

    return {
      runId: results[0].runId,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.status === "pass").length,
        warnings: results.filter((r) => r.status === "warn").length,
        failed: results.filter((r) => r.status === "fail").length,
      },
      checks: results.map((r) => ({
        checkCode: r.checkCode,
        status: r.status,
        title: r.title,
        detail: r.detail,
        subDetail: r.subDetail,
        severity: r.severity,
      })),
    };
  }

  /**
   * Load CheckRule records for a country group and parse their parameters.
   */
  private async loadRuleParams(countryGroupCode: string): Promise<Record<string, RuleParams>> {
    const rules = await db.checkRule.findMany({
      where: { countryGroupCode, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const params: Record<string, RuleParams> = {};
    for (const rule of rules) {
      try {
        params[rule.ruleCode] = rule.parameters ? JSON.parse(rule.parameters) : {};
      } catch {
        params[rule.ruleCode] = {};
      }
    }
    return params;
  }

  /**
   * Run AI-powered advisory check. Returns additional observations that
   * supplement the deterministic checks. Failures are caught and ignored
   * so AI availability never blocks the user.
   */
  private async runAICheck(
    application: {
      country: { countryGroupCode: string; name: string };
      applicantProfile: { purposeOfTravel: string | null; travelStartDate: Date | null; travelEndDate: Date | null } | null;
      travelPlan: { tripLengthDays: number | null } | null;
      employmentProfile: { employmentStatus: string | null } | null;
      documents: { documentType: string; extractions: { normalizedPayload: string }[] }[];
      refusalHistoryEntries: unknown[];
      visaHistoryEntries: unknown[];
    },
    _ctx: CheckContext,
  ): Promise<CheckOutput[]> {
    if (!isAIEnabled()) return [];

    try {
      // Extract passport expiry from extraction data if available
      let passportExpiry: string | null = null;
      const passportDoc = application.documents.find((d) => d.documentType === "passport" && d.extractions.length > 0);
      if (passportDoc) {
        try {
          const parsed = JSON.parse(passportDoc.extractions[0].normalizedPayload);
          passportExpiry = parsed.expiryDate ?? null;
        } catch { /* ignore */ }
      }

      const fmtDate = (d: Date | null | undefined) =>
        d ? d.toISOString().slice(0, 10) : null;

      const prompt = buildDocumentCheckPrompt({
        destination: application.country.name,
        countryGroup: application.country.countryGroupCode,
        purpose: application.applicantProfile?.purposeOfTravel ?? null,
        travelStart: fmtDate(application.applicantProfile?.travelStartDate),
        travelEnd: fmtDate(application.applicantProfile?.travelEndDate),
        tripDays: application.travelPlan?.tripLengthDays ?? null,
        employmentStatus: application.employmentProfile?.employmentStatus ?? null,
        uploadedDocTypes: application.documents.map((d) => d.documentType),
        extractedPassportExpiry: passportExpiry,
        hasRefusals: application.refusalHistoryEntries.length > 0,
        refusalCount: application.refusalHistoryEntries.length,
        visaHistoryCount: application.visaHistoryEntries.length,
      });

      const raw = await generateText(
        DOCUMENT_CHECK_SYSTEM_PROMPT,
        prompt,
        { temperature: 0.2, maxTokens: 800 },
      );

      // Parse JSON from the response (strip markdown code fences if present)
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const observations = JSON.parse(cleaned) as {
        code: string;
        severity: "error" | "warning" | "info";
        title: string;
        detail: string;
      }[];

      if (!Array.isArray(observations)) return [];

      return observations.slice(0, 5).map((obs) => ({
        checkCode: `ai_${obs.code}`,
        status: obs.severity === "error" ? "warn" as const : obs.severity === "warning" ? "warn" as const : "pass" as const,
        title: `AI: ${obs.title}`.slice(0, 100),
        detail: obs.detail ?? null,
        subDetail: null,
        severity: obs.severity === "error" ? "warning" as const : obs.severity === "warning" ? "info" as const : "info" as const,
      }));
    } catch (err) {
      console.error("AI check failed (non-blocking):", err);
      return [];
    }
  }
}
