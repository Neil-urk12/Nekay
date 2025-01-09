import Dexie, { Table } from "dexie";
import {
  BaseItem,
  JournalEntry,
  Task,
  Folder,
} from "../composables/interfaces";

export interface Note extends BaseItem {
  content: string;
}

export interface PomodoroSession extends BaseItem {
  startTime: number;
  endTime: number;
  duration: number;
  type: "work" | "break";
  completed: boolean;
}

export interface PomodoroStats extends BaseItem {
  completedSessions: number;
  totalFocusTime: number;
}

class NekayDatabase extends Dexie {
  tasks!: Table<Task>;
  journal!: Table<JournalEntry>;
  folders!: Table<Folder>;
  notes!: Table<Note>;
  pomodoro!: Table<PomodoroSession>;

  constructor() {
    super("NekayOfflineDB_v2");

    this.version(2).stores({
      tasks:
        "id, taskContent, status, folderId, syncStatus, lastModified, timestamp, [syncStatus+lastModified]",
      journal:
        "id, title, folderId, date, lastModified, [syncStatus+lastModified]",
      folders:
        "id, name, type, syncStatus, numOfItems, lastModified, timestamp, [syncStatus+lastModified]",
      notes:
        "id, noteTitle, noteContent, syncStatus, timestamp, lastModified, [syncStatus+lastModified]",
      pomodoro:
        "id, type, syncStatus, startTime, timestamp, lastModified, [syncStatus+lastModified]",
    });

    this.tasks = this.table("tasks");
    this.journal = this.table("journal");
    this.folders = this.table("folders");
    this.notes = this.table("notes");
    this.pomodoro = this.table("pomodoro");
  }

  async createFolder(folderObj: Folder) {
    if (!folderObj) return { success: false };
    this.folders.add(folderObj);
    return { success: true };
  }

  async getFolders() {
    return this.folders.toArray();
  }

  async updateFolder(folder: Folder) {
    if (!folder) {
      throw new Error("Folder to delete doesn't exist");
    }
    await db.folders.delete(folder);
  }
}
export const db = new NekayDatabase();
