import { chromium, type Browser, type Page } from "playwright";
import type { AppointmentSlot, ScraperResult } from "./providers/base";

const TLSCONTACT_EMAIL = process.env.TLSCONTACT_EMAIL ?? "";
const TLSCONTACT_PASSWORD = process.env.TLSCONTACT_PASSWORD ?? "";
const VFS_EMAIL = process.env.VFS_EMAIL ?? "";
const VFS_PASSWORD = process.env.VFS_PASSWORD ?? "";
const BLS_EMAIL = process.env.BLS_EMAIL ?? "";
const BLS_PASSWORD = process.env.BLS_PASSWORD ?? "";
const VFS_INDIA_EMAIL = process.env.VFS_INDIA_EMAIL ?? "";
const VFS_INDIA_PASSWORD = process.env.VFS_INDIA_PASSWORD ?? "";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
  }
  return browser;
}

async function createStealthPage(): Promise<Page> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    const anyWindow = window as unknown as Record<string, unknown> & { chrome?: unknown };
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    anyWindow.chrome = { runtime: {} };
  });

  return page;
}

export interface ScrapeResult {
  available: boolean;
  slots: AppointmentSlot[];
  html?: string;
}

export async function scrapeTLSContactFrance(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    const url = "https://fr.tlscontact.com/gb/LON/page.php?pid=appointment";
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const title = await page.title();
    if (title.includes("Robot") || title.includes("Access")) {
      return { available: false, slots: [], html: "Blocked by anti-bot" };
    }

    const loginButton = await page.$('a[href*="login"], button:has-text("Login"), a:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"], input[type="email"]', TLSCONTACT_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', TLSCONTACT_PASSWORD);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const availableDates: AppointmentSlot[] = [];

    const dateElements = await page.$$eval(
      ".calendar-day, .date-picker, .appointment-date, [class*='calendar'], [class*='date'], td a:not([class*='disabled'])",
      (els) => {
        return els
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.match(/\d{1,4}[-\/\s]\d{1,2}[-\/\s]\d{1,4}/));
      }
    );

    for (const dateText of dateElements) {
      if (dateText) {
        availableDates.push({ date: dateText, city: "London" });
      }
    }

    const noSlots = await page.$('text=No slots available, text=No appointments, text=not available');
    const hasSlots = availableDates.length > 0 && !noSlots;

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("TLScontact scrape error:", error);
    return { available: false, slots: [] };
  } finally {
    await page.close();
  }
}

export async function scrapeVFSItaly(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    const url = "https://visa.vfsglobal.com/gbr/en/ita/";
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const loginButton = await page.$('a[href*="login"], button:has-text("Login"), a:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"], input[type="email"]', VFS_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', VFS_PASSWORD);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const availableDates: AppointmentSlot[] = [];

    const dateElements = await page.$$eval(
      ".calendar-day, .date-picker, .appointment-date, [class*='calendar'], [class*='date'], td a:not([class*='disabled'])",
      (els) => {
        return els
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.match(/\d{1,4}[-\/\s]\d{1,2}[-\/\s]\d{1,4}/));
      }
    );

    for (const dateText of dateElements) {
      if (dateText) {
        availableDates.push({ date: dateText, city: "London" });
      }
    }

    const noSlots = await page.$('text=No slots available, text=No appointments, text=not available');
    const hasSlots = availableDates.length > 0 && !noSlots;

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("VFS Italy scrape error:", error);
    return { available: false, slots: [] };
  } finally {
    await page.close();
  }
}

export async function scrapeVFSSpain(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    const url = "https://visa.vfsglobal.com/gbr/en/esp/";
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const loginButton = await page.$('a[href*="login"], button:has-text("Login"), a:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"], input[type="email"]', VFS_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', VFS_PASSWORD);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const availableDates: AppointmentSlot[] = [];

    const dateElements = await page.$$eval(
      ".calendar-day, .date-picker, .appointment-date, [class*='calendar'], [class*='date'], td a:not([class*='disabled'])",
      (els) => {
        return els
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.match(/\d{1,4}[-\/\s]\d{1,2}[-\/\s]\d{1,4}/));
      }
    );

    for (const dateText of dateElements) {
      if (dateText) {
        availableDates.push({ date: dateText, city: "London" });
      }
    }

    const noSlots = await page.$('text=No slots available, text=No appointments, text=not available');
    const hasSlots = availableDates.length > 0 && !noSlots;

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("VFS Spain scrape error:", error);
    return { available: false, slots: [] };
  } finally {
    await page.close();
  }
}

export async function scrapeBLSSpain(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    const url = "https://blsspainvisa.com/uk/";
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const loginButton = await page.$('a[href*="login"], button:has-text("Login"), a:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"], input[type="email"]', BLS_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', BLS_PASSWORD);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const availableDates: AppointmentSlot[] = [];

    const dateElements = await page.$$eval(
      ".calendar-day, .date-picker, .appointment-date, [class*='calendar'], [class*='date'], td a:not([class*='disabled'])",
      (els) => {
        return els
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.match(/\d{1,4}[-\/\s]\d{1,2}[-\/\s]\d{1,4}/));
      }
    );

    for (const dateText of dateElements) {
      if (dateText) {
        availableDates.push({ date: dateText, city: "London" });
      }
    }

    const noSlots = await page.$('text=No slots available, text=No appointments, text=not available');
    const hasSlots = availableDates.length > 0 && !noSlots;

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("BLS Spain scrape error:", error);
    return { available: false, slots: [] };
  } finally {
    await page.close();
  }
}

export async function scrapeTLSContactGermany(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    const url = "https://de.tlscontact.com/gb/LON/page.php?pid=appointment";
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const loginButton = await page.$('a[href*="login"], button:has-text("Login"), a:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"], input[type="email"]', TLSCONTACT_EMAIL);
      await page.fill('input[name="password"], input[type="password"]', TLSCONTACT_PASSWORD);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const availableDates: AppointmentSlot[] = [];

    const dateElements = await page.$$eval(
      ".calendar-day, .date-picker, .appointment-date, [class*='calendar'], [class*='date'], td a:not([class*='disabled'])",
      (els) => {
        return els
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.match(/\d{1,4}[-\/\s]\d{1,2}[-\/\s]\d{1,4}/));
      }
    );

    for (const dateText of dateElements) {
      if (dateText) {
        availableDates.push({ date: dateText, city: "London" });
      }
    }

    const noSlots = await page.$('text=No slots available, text=No appointments, text=not available');
    const hasSlots = availableDates.length > 0 && !noSlots;

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("TLScontact Germany scrape error:", error);
    return { available: false, slots: [] };
  } finally {
    await page.close();
  }
}

export async function scrapeVFSIndiaSwitzerland(): Promise<ScrapeResult> {
  const page = await createStealthPage();
  try {
    console.log("[VFS India CH] Starting scrape...");

    const loginUrl = "https://visa.vfsglobal.com/ind/en/che/login";
    await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 60000 });

    const title = await page.title();
    console.log("[VFS India CH] Page title:", title);
    if (title.includes("Robot") || title.includes("Access Denied")) {
      return { available: false, slots: [], html: "Blocked by anti-bot" };
    }

    const currentUrl = page.url();
    console.log("[VFS India CH] Current URL:", currentUrl);

    const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"], input[id*="email"], input[type="text"]');
    if (emailInput) {
      await emailInput.fill(VFS_INDIA_EMAIL);
      await page.waitForTimeout(500);
    }

    const passwordInput = await page.$('input[type="password"], input[name="password"], input[id*="password"]');
    if (passwordInput) {
      await passwordInput.fill(VFS_INDIA_PASSWORD);
      await page.waitForTimeout(500);
    }

    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")');
    if (submitBtn) {
      await submitBtn.click();
      console.log("[VFS India CH] Clicked login...");
      await page.waitForURL("**/dashboard**", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(5000);
    }

    console.log("[VFS India CH] URL after login:", page.url());

    const newBookingLink = await page.$('a:has-text("Start New Booking"), a:has-text("New Booking"), button:has-text("Start New Booking"), [href*="booking"]:has-text("New")');
    if (newBookingLink) {
      await newBookingLink.click();
      console.log("[VFS India CH] Clicked Start New Booking...");
      await page.waitForTimeout(3000);
    }

    console.log("[VFS India CH] URL after booking click:", page.url());

    const availableDates: AppointmentSlot[] = [];

const dateElements = await page.$$eval(
      '.calendar-day, .date-picker, .appointment-date, [class*="calendar"], [class*="date"], td a:not([class*="disabled"]), [class*="slot"]:not([class*="disabled"]), [data-date]',
      (els) => {
        return els
          .map((el) => {
            const dateAttr = el.getAttribute("data-date");
            const dayText = el.textContent?.trim();
            return dateAttr || dayText;
          })
          .filter((text) => text && text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}/i));
      }
    );

    console.log("[VFS India CH] Found date elements:", dateElements.length);

    for (const dateText of dateElements) {
      if (dateText && !availableDates.find((s) => s.date === dateText)) {
        availableDates.push({ date: dateText, city: "India", category: "tourist" });
      }
    }

    const noSlotsEl = await page.$('text=No slots available, text=No appointments, text=not available, text=Currently there are no appointments, text=Calendar is full');
    const hasSlots = availableDates.length > 0 && !noSlotsEl;

    console.log("[VFS India CH] Slots found:", availableDates.length, "hasSlots:", hasSlots);

    return {
      available: hasSlots,
      slots: hasSlots ? availableDates : [],
    };
  } catch (error) {
    console.error("[VFS India CH] Scrape error:", error);
    return { available: false, slots: [], html: String(error) };
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
