import { ScraperService } from "@/server/scrapers/scraper.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const scraperService = new ScraperService();

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev: allow without secret

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (isVercel) {
    return new Response("Not Found", { status: 404 });
  }

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

export async function POST(request: Request) {
  if (isVercel) {
    return new Response("Not Found", { status: 404 });
  }
  return GET(request);
}