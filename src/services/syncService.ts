import { indexedDBService } from "./indexedDB";
import {
  storeTask,
  storeJournalEntry,
  storeFolder,
} from "../firebase/firestore-service";

export class SyncService {
  private isSyncing = false;

  // Start sync process
  async syncData(): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;

      // Sync tasks
      const pendingTasks = await indexedDBService.getPendingSyncItems("tasks");
      for (const task of pendingTasks) {
        try {
          await storeTask(task);
          await indexedDBService.updateSyncStatus("tasks", task.id, "synced");
        } catch (error) {
          console.error("Error syncing task:", error);
          await indexedDBService.updateSyncStatus("tasks", task.id, "failed");
        }
      }

      // Sync journal entries
      const pendingEntries = await indexedDBService.getPendingSyncItems(
        "journal"
      );
      for (const entry of pendingEntries) {
        try {
          await storeJournalEntry(entry);
          await indexedDBService.updateSyncStatus(
            "journal",
            entry.id,
            "synced"
          );
        } catch (error) {
          console.error("Error syncing journal entry:", error);
          await indexedDBService.updateSyncStatus(
            "journal",
            entry.id,
            "failed"
          );
        }
      }

      // Sync folders
      const pendingFolders = await indexedDBService.getPendingSyncItems(
        "folders"
      );
      for (const folder of pendingFolders) {
        try {
          await storeFolder(folder);
          await indexedDBService.updateSyncStatus(
            "folders",
            folder.id,
            "synced"
          );
        } catch (error) {
          console.error("Error syncing folder:", error);
          await indexedDBService.updateSyncStatus(
            "folders",
            folder.id,
            "failed"
          );
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
