import { ScraperService } from "@/server/scrapers/scraper.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const scraperService = new ScraperService();

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev: allow without secret

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const results = await scraperService.runScheduledChecks();

    return jsonResponse({
      ran: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

// Support POST for QStash/webhook triggers
export async function POST(request: Request) {
  return GET(request);
}
