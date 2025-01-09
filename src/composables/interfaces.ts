export interface BaseItem {
  id: string;
  folderId?: string;
  syncStatus: "synced" | "pending" | "failed";
  lastModified: number;
  timestamp: number;
}

export interface Task extends BaseItem {
  taskContent: string;
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  type: "task" | "journal";
  syncStatus: "synced" | "pending" | "failed";
  numOfItems: number;
  lastModified: number;
  timestamp: number;
}

export interface JournalEntry extends BaseItem {
  title: string;
  content: string;
  status: "deleted" | "archived" | "active";
  date: string;
}
