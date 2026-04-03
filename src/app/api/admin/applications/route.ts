import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db/client";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const applications = await db.application.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        country: { select: { name: true, code: true, slug: true } },
        applicantProfile: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { documents: true } },
      },
    });

    return jsonResponse({ applications });
  } catch (error) {
    return handleRouteError(error);
  }
}
