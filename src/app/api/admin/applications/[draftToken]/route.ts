import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db/client";
import { getStorage } from "@/server/documents/storage";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { draftToken } = await params;

    const application = await db.application.findUnique({
      where: { draftToken },
      include: {
        country: true,
        applicantProfile: true,
        travelPlan: true,
        companionGroup: true,
        employmentProfile: true,
        visaHistoryEntries: { orderBy: { sortOrder: "asc" } },
        refusalHistoryEntries: { orderBy: { sortOrder: "asc" } },
        documents: {
          where: { uploadStatus: { not: "DELETED" } },
          orderBy: { createdAt: "asc" },
        },
        checkResults: { orderBy: { createdAt: "desc" } },
        generatedPack: true,
        orders: { include: { serviceTier: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storage = getStorage();
    const documents = application.documents.map((doc) => ({
      ...doc,
      url: storage.getUrl(doc.storageKey),
    }));

    return jsonResponse({ application: { ...application, documents } });
  } catch (error) {
    return handleRouteError(error);
  }
}
