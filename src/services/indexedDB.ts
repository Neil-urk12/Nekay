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

export interface WaterEntry extends BaseItem {
  amount: number;
  date: string;
}

class NekayDatabase extends Dexie {
  tasks!: Table<Task>;
  journal!: Table<JournalEntry>;
  folders!: Table<Folder>;
  notes!: Table<Note>;
  pomodoro!: Table<PomodoroSession>;
  waterEntries!: Table<WaterEntry>;

  constructor() {
    super("NekayOfflineDB_v2");

    this.version(3).stores({
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
      waterEntries: "id, amount, date, timestamp, syncStatus, lastModified, [syncStatus+lastModified]",
    });

    this.tasks = this.table("tasks");
    this.journal = this.table("journal");
    this.folders = this.table("folders");
    this.notes = this.table("notes");
    this.pomodoro = this.table("pomodoro");
  }

  async createFolder(folderObj: Folder) {
    if (!folderObj) throw new Error("Error creating folder!");
    this.folders.add(folderObj);
  }

  async getFolders() {
    return this.folders.toArray();
  }

  async deleteFolder(folderId: string) {
    if (!folderId) throw new Error("Folder to delete doesn't exist");

    await this.folders.delete(folderId);
  }

  async updateFolder(folderId: string, changes: Folder) {
    if (!changes && !folderId)
      throw new Error("Folder to update doesn't exist");

    await this.folders.update(folderId, changes);
  }

  async createTask(task: Task) {
    if (!task) throw new Error("Failed to create task");

    await this.tasks.add(task);
  }

  async getTasks() {
    return await this.tasks.toArray();
  }

  async updateTask(taskId: string, changes: Task) {
    if (!taskId && !changes) throw new Error("Failed to update task!");

    await this.tasks.update(taskId, changes);
  }

  async deleteTask(taskId: string) {
    if (!taskId) throw new Error("Failed to delete task!");

    await this.tasks.delete(taskId);
  }

  async createEntry(entry: JournalEntry) {
    if (!entry) throw new Error("Failed to create journal entry!");

    await this.journal.add(entry);
  }

  async getEntries() {
    return await this.journal.toArray();
  }

  async updateEntry(entryId: string, changes: JournalEntry) {
    if (!entryId && !changes) throw new Error("Failed to update entry!");

    await this.journal.update(entryId, changes);
  }

  async deleteEntry(entryId: string) {
    if (!entryId) throw new Error("Failed to delete entry!");

    await this.journal.delete(entryId);
  }

  async getWaterEntries() {
    return await this.waterEntries.toArray()
  }

  async createWaterEntry(entry: WaterEntry) {
    return await this.waterEntries.add(entry);
  }

  async deleteWaterEntry(id: string) {
    return await this.waterEntries.delete(id);
  }
}
export const db = new NekayDatabase();
