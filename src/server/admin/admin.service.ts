import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";

export class AdminService {
  // ─── Country Groups ─────────────────────────────────────

  async listCountryGroups() {
    return db.countryGroup.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { countries: true } },
      },
    });
  }

  async getCountryGroup(code: string) {
    const group = await db.countryGroup.findUnique({
      where: { code },
      include: {
        countries: {
          select: { slug: true, name: true, code: true, isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
    if (!group) {
      throw new ApiError(404, "GROUP_NOT_FOUND", `Country group '${code}' not found`);
    }
    return group;
  }

  async updateCountryGroup(code: string, data: {
    name?: string;
    description?: string;
    defaultCurrency?: string;
    coverLetterTemplate?: string | null;
    isActive?: boolean;
  }) {
    const group = await db.countryGroup.findUnique({ where: { code } });
    if (!group) {
      throw new ApiError(404, "GROUP_NOT_FOUND", `Country group '${code}' not found`);
    }
    return db.countryGroup.update({ where: { code }, data });
  }

  // ─── Check Rules ────────────────────────────────────────

  async listCheckRules(countryGroupCode?: string) {
    return db.checkRule.findMany({
      where: countryGroupCode ? { countryGroupCode } : undefined,
      orderBy: [{ countryGroupCode: "asc" }, { sortOrder: "asc" }],
    });
  }

  async getCheckRule(id: string) {
    const rule = await db.checkRule.findUnique({ where: { id } });
    if (!rule) {
      throw new ApiError(404, "RULE_NOT_FOUND", "Check rule not found");
    }
    return {
      ...rule,
      parameters: rule.parameters ? JSON.parse(rule.parameters) : null,
    };
  }

  async upsertCheckRule(data: {
    ruleCode: string;
    countryGroupCode: string;
    title: string;
    description?: string;
    parameters?: Record<string, unknown>;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const parametersJson = data.parameters ? JSON.stringify(data.parameters) : null;

    return db.checkRule.upsert({
      where: {
        ruleCode_countryGroupCode: {
          ruleCode: data.ruleCode,
          countryGroupCode: data.countryGroupCode,
        },
      },
      create: {
        ruleCode: data.ruleCode,
        countryGroupCode: data.countryGroupCode,
        title: data.title,
        description: data.description ?? null,
        parameters: parametersJson,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      update: {
        title: data.title,
        description: data.description ?? undefined,
        parameters: parametersJson,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
  }

  async deleteCheckRule(id: string) {
    const rule = await db.checkRule.findUnique({ where: { id } });
    if (!rule) {
      throw new ApiError(404, "RULE_NOT_FOUND", "Check rule not found");
    }
    await db.checkRule.delete({ where: { id } });
    return { deleted: true };
  }
}
