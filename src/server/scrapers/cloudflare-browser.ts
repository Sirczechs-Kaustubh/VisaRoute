const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID ?? "";
const CF_API_TOKEN = process.env.CF_API_TOKEN ?? "";
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/browser-rendering`;

const APPOINTMENT_PROMPT =
  "Extract all available visa appointment dates, times, and cities from this page. " +
  "Return JSON with fields: available (boolean), slots (array of {date, time, city, category}).";

const AI_RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "appointments",
    schema: {
      type: "object",
      properties: {
        available: { type: "boolean" },
        slots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              time: { type: "string" },
              city: { type: "string" },
              category: { type: "string" },
            },
          },
        },
      },
    },
  },
};

function cfHeaders() {
  return {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export interface ScrapeOptions {
  selectors?: Array<{ selector: string }>;
  waitForSelector?: string;
}

/** CSS-selector based scrape — fast, cheapest on browser time */
export async function cfScrape(url: string, options: ScrapeOptions = {}): Promise<unknown> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN are required for browser rendering");
  }

  const body: Record<string, unknown> = {
    url,
    gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (options.selectors?.length) {
    body.elements = options.selectors;
  }
  if (options.waitForSelector) {
    body.waitForSelector = options.waitForSelector;
  }

  const res = await fetch(`${BASE_URL}/scrape`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CF scrape failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json;
}

/** AI-powered JSON extraction — resilient to DOM changes, ~15-20s */
export async function cfJsonExtract(url: string): Promise<unknown> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN are required for browser rendering");
  }

  const res = await fetch(`${BASE_URL}/json`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({
      url,
      prompt: APPOINTMENT_PROMPT,
      response_format: AI_RESPONSE_SCHEMA,
      gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CF JSON extract failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  // /json endpoint returns the extracted object directly in .result
  return (json as { result?: unknown }).result ?? json;
}

/** Plain HTML fetch — try before browser rendering for server-rendered pages */
export async function cfContent(url: string): Promise<unknown> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN are required for browser rendering");
  }

  const res = await fetch(`${BASE_URL}/content`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({ url, gotoOptions: { waitUntil: "domcontentloaded", timeout: 20000 } }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CF content failed (${res.status}): ${text}`);
  }

  return res.json();
}
