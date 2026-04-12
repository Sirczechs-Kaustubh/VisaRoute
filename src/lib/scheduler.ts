import cron, { ScheduledTask } from "node-cron";
import { ScraperService } from "@/server/scrapers/scraper.service";

const scheduler = new ScraperService();

const CRON_SCHEDULE = process.env.SCRAPER_CRON_SCHEDULE || "*/30 * * * *";

let scheduledTask: ScheduledTask | null = null;

export function startScheduler(): void {
  console.log(`[Scheduler] Starting cron job: ${CRON_SCHEDULE}`);

  scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
    console.log("[Scheduler] Running scheduled check...");
    try {
      const results = await scheduler.runScheduledChecks();
      console.log(
        "[Scheduler] Completed:",
        results.map((r) => `${r.configId}:${r.status}`).join(", ")
      );
    } catch (error) {
      console.error("[Scheduler] Error running checks:", error);
    }
  });

  console.log("[Scheduler] Cron job scheduled successfully");
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  console.log("[Scheduler] Stopped");
}
