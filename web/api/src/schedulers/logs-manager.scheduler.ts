import Cron from "croner";
import QLogController from "../controllers/qlog.controller";

export function archiveLogsScheduler(): void {
  Cron(
    "0 0 1 * * *", // everyday at 1AM
    {
      name: "ARCHIVE-LOGS",
      protect: true,
    },
    async () => {
      await QLogController.getInstance().archiveLogs();
    }
  );
}

export function purgeArchivedLogsScheduler(): void {
  Cron(
    "0 0 3 * * *", // everyday at 3AM
    {
      name: "PURGE-ARCHIVED-LOGS",
      protect: true,
    },
    async () => {
      await QLogController.getInstance().purgeArchivedLogs();
    }
  );
}
