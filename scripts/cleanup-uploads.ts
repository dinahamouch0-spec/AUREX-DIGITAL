// Standalone runner for the same cleanup logic the /api/cron/cleanup-photos
// route uses — handy for self-hosted deployments without Vercel Cron, or
// for running the sweep manually / via a system crontab.
import { runUploadCleanup } from "../src/lib/upload-cleanup";

runUploadCleanup()
  .then((result) => {
    console.log("Upload cleanup complete:", result);
    process.exit(result.errors.length > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("Upload cleanup failed:", err);
    process.exit(1);
  });
