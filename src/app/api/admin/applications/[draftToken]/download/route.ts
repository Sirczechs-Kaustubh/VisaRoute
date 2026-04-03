import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db/client";
import { getStorage } from "@/server/documents/storage";
import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { draftToken } = await params;

  const application = await db.application.findUnique({
    where: { draftToken },
    include: {
      applicantProfile: { select: { firstName: true, lastName: true } },
      country: { select: { name: true } },
      documents: {
        where: { uploadStatus: { not: "DELETED" } },
        orderBy: { createdAt: "asc" },
      },
      generatedPack: true,
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storage = getStorage();
  const zip = new JSZip();

  const applicantName = [
    application.applicantProfile?.firstName,
    application.applicantProfile?.lastName,
  ]
    .filter(Boolean)
    .join("_") || draftToken.slice(0, 8);

  const folder = zip.folder(`${application.country.name}_${applicantName}`)!;

  // Add uploaded documents
  const docFolder = folder.folder("documents")!;
  for (const doc of application.documents) {
    try {
      const buffer = await storage.read(doc.storageKey);
      docFolder.file(doc.originalFileName, buffer);
    } catch {
      // Skip files that can't be read
    }
  }

  // Add generated pack text files if present
  if (application.generatedPack) {
    const packFolder = folder.folder("generated_pack")!;
    if (application.generatedPack.coverLetterText) {
      packFolder.file("cover_letter.txt", application.generatedPack.coverLetterText);
    }
    if (application.generatedPack.checklistText) {
      packFolder.file("checklist.txt", application.generatedPack.checklistText);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${application.country.name}_${applicantName}_application.zip"`,
      "Content-Length": zipBuffer.length.toString(),
    },
  });
}
