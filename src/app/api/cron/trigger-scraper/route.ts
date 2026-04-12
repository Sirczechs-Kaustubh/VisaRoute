import { ScraperService } from "@/server/scrapers/scraper.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new ScraperService();

export async function POST(request: Request) {
  try {
    const results = await service.runScheduledChecks();
    return jsonResponse({ success: true, results });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  return jsonResponse({ status: "ok", message: "Use POST to trigger scraper" });
}
