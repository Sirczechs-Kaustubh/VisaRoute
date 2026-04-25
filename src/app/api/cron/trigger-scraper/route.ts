import { ScraperService } from "@/server/scrapers/scraper.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";

const service = new ScraperService();

export async function POST(request: Request) {
  if (isVercel) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const results = await service.runScheduledChecks();
    return jsonResponse({ success: true, results });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  if (isVercel) {
    return new Response("Not Found", { status: 404 });
  }
  return jsonResponse({ status: "ok", message: "Use POST to trigger scraper" });
}