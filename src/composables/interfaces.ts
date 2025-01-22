export interface BaseItem {
  id: string;
  folderId?: string | "alltasks";
  syncStatus: "synced" | "pending" | "failed" | "deleted";
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
  type: "task" | "journal" | "allTasks";
  syncStatus: "synced" | "pending" | "failed" | "deleted";
  numOfItems: number;
  lastModified: number;
  timestamp: number;
}

export interface JournalEntry extends BaseItem {
  title: string;
  content: string;
  status: "deleted" | "archived" | "active" | "failed";
  date: string;
}
