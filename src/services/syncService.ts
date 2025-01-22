import { db as fireDb } from "../firebase/firebase-config";
import { db } from "./indexedDB";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  // query,
  // where,
  // getDocs,
  // doc,
  // setDoc,
  // deleteDoc,
} from "firebase/firestore";
import debounce from "lodash/debounce";

type SyncableCollection = "tasks" | "folders" | "journal" | "pomodoro";
type SyncStatus = "pending" | "syncing" | "synced" | "error";

interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  error: Error | null;
  progress: number;
}

export class SyncService {
  private static instance: SyncService;
  private listeners: Map<string, () => void> = new Map();
  private syncState: Map<SyncableCollection, SyncState> = new Map();
  // private retryAttempts: Map<string, number> = new Map();
  // private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly BATCH_SIZE = 500;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupNetworkListeners();
    this.initializeSyncStates();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private initializeSyncStates() {
    const collections: SyncableCollection[] = [
      "tasks",
      "folders",
      "journal",
      "pomodoro",
    ];
    collections.forEach((collection) => {
      this.syncState.set(collection, {
        status: "synced",
        lastSync: null,
        error: null,
        progress: 0,
      });
    });
  }

  private setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncAll();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.removeAllListeners();
    });
  }

  private async setupRealtimeListener(collectionName: SyncableCollection) {
    const collectionRef = collection(fireDb, collectionName);

    const unsubscribe = onSnapshot(
      collectionRef,
      debounce(async (snapshot) => {
        if (!this.isOnline) return;

        for (const change of snapshot.docChanges()) {
          const data = change.doc.data();
          const id = change.doc.id;

          try {
            switch (change.type) {
              case "added":
              case "modified":
                await this.handleIncomingChange(collectionName, id, data);
                break;
              case "removed":
                await this.handleRemoteDelete(collectionName, id);
                break;
            }
          } catch (error) {
            console.error(`Sync error for ${collection}:`, error);
            this.updateSyncState(collectionName, "error", error as Error);
          }
        }
      }, 1500)
    );

    this.listeners.set(collectionName, unsubscribe);
  }

  private async handleIncomingChange(
    collection: SyncableCollection,
    id: string,
    data: any
  ) {
    const localData = await this.getLocalItem(collection, id);

    if (!localData) {
      await this.updateLocalItem(collection, id, data);
      return
    } 

    const localModified = localData.lastModified;
    const remoteModified = data.lastModified;

    if (localModified < remoteModified) {
      await this.updateLocalItem(collection, id, data);
    } else if (localModified > remoteModified) {
      const docRef = doc(fireDb, collection, id);
      await setDoc (docRef, {
        ...localData,
        syncStatus: "synced"
      });
      await this.updateLocalItem(collection, id, {
        ...localData,
        syncStatus: "synced"
      });
    }
  }

  private async handleRemoteDelete(collection: SyncableCollection, id: string) {
    try {
      switch (collection) {
        case "tasks":
          await db.deleteTask(id);
          break;
        case "folders":
          await db.deleteFolder(id);
          break;
        case "journal":
          await db.deleteEntry(id);
          break;
      }
    } catch (error) {
      console.error(`Failed to delete ${collection} item locally:`, error);
    }
  }

  private async getLocalItem(collection: SyncableCollection, id: string) {
    switch (collection) {
      case "tasks":
        return await db.tasks.where("id").equals(id).first();
      case "folders":
        return await db.folders.where("id").equals(id).first();
      case "journal":
        return await db.journal.where("id").equals(id).first();
      default:
        return null;
    }
  }

  private async syncFromFirestore(collectionToSync: SyncableCollection) {
    console.log(`Syncing from Firestore for collection: ${collectionToSync}`); // Debug log

    try {
      const collectionName = collectionToSync === "journal" ? "entries" : collectionToSync;
      const querySnapshot = await getDocs(collection(fireDb, collectionName));

      for (const doc of querySnapshot.docs) {
        const data = { id: doc.id, ...doc.data() };
        await this.updateLocalItem(collectionToSync, doc.id, {
          ...data,
          syncStatus: "synced",
        });
      }
    } catch (error) {
      console.error(`Error syncing from Firestore for ${collectionToSync}:`, error);
      throw error;
    }
  }

  private async updateLocalItem(
    collection: SyncableCollection,
    id: string,
    data: any
  ) {
    console.log(`Updating/Creating local item in ${collection}:`, data);

    try {
      const existingItem = await this.getLocalItem(collection, id);
      
      switch (collection) {
        case "tasks":
          if (existingItem) {
            await db.updateTask(id, data);
          } else {
            await db.createTask(data);
          }
          break;
        case "folders":
          if (existingItem) {
            await db.updateFolder(id, data);
          } else {
            await db.createFolder(data);
          }
          break;
        case "journal":
          if (existingItem) {
            await db.updateEntry(id, data);
          } else {
            await db.createEntry(data);
          }
          break;
      }
    } catch (error) {
      console.error(`Error updating/creating local item in ${collection}:`, error);
      throw error;
    }
  }

  private async getPendingItems(collection: SyncableCollection) {
    console.log(`Getting pending items for ${collection}`); // Debug log

    try {
      switch (collection) {
        case "tasks":
          const tasks = await db.tasks
            .where("syncStatus")
            .equals("pending")
            .toArray();
          console.log(`Found ${tasks.length} pending tasks`); // Debug log
          return tasks;
        case "folders":
          return await db.folders
            .where("syncStatus")
            .equals("pending")
            .toArray();
        case "journal":
          return await db.journal
            .where("syncStatus")
            .equals("pending")
            .toArray();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error getting pending items for ${collection}:`, error);
      throw error;
    }
  }

  private async getDeletedItems(collection: SyncableCollection) {
    console.log(`Getting deleted items for ${collection}`);

    try {
      switch (collection) {
        case "tasks":
          const tasks = await db.tasks
            .where("syncStatus")
            .equals("deleted")  
            .toArray();
          console.log(`Found ${tasks.length} pending tasks`);
          return tasks;
        case "folders":
          return await db.folders
            .where("syncStatus")
            .equals("deleted")
            .toArray();
        case "journal":
          return await db.journal
            .where("syncStatus")
            .equals("deleted")
            .toArray();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error getting pending items for ${collection}:`, error);
      throw error;
    }
  }

  private updateSyncState(
    collection: SyncableCollection,
    status: SyncStatus,
    error: Error | null = null
  ) {
    const state = this.syncState.get(collection)!;
    this.syncState.set(collection, {
      ...state,
      status,
      error,
      lastSync: status === "synced" ? new Date() : state.lastSync,
    });
  }

  async syncAll() {
    if (!this.isOnline) return;

    const collections: SyncableCollection[] = [
      "tasks",
      "folders",
      "journal",
      "pomodoro",
    ];

    for (const collection of collections) {
      try {
        this.updateSyncState(collection, "syncing");
        await this.syncCollection(collection);
        this.setupRealtimeListener(collection);
        this.updateSyncState(collection, "synced");
      } catch (error) {
        console.error(`Failed to sync ${collection}:`, error);
        this.updateSyncState(collection, "error", error as Error);
      }
    }
  }

  private async syncCollection(collection: SyncableCollection) {
    console.log(`Starting sync for collection: ${collection}`);
    try {
      const pendingItems = await this.getPendingItems(collection);
      const deletedItems = await this.getDeletedItems(collection);  

      for (const item of deletedItems) {
        const docRef  = doc(fireDb, collection, item.id);
        await deleteDoc(docRef);
        await this.deleteLocalItem(collection, item.id);
      }

      const itemsToSync = pendingItems.filter(item => item.syncStatus === 'pending');
      if (itemsToSync.length === 0) {
        await this.syncFromFirestore(collection);
        return;
      }

      if (pendingItems.length === 0) {
        await this.syncFromFirestore(collection);
        return;
      }

      for (let i = 0; i < pendingItems.length; i += this.BATCH_SIZE) {
        const batch = writeBatch(fireDb);
        const chunk = pendingItems.slice(i, i + this.BATCH_SIZE);

        for (const item of chunk) {
          const docRef = doc(fireDb, collection, item.id);

          const itemToSync = {
            ...item,
            lastModified: Date.now(),
            timestamp: item.timestamp || Date.now(),
            syncStatus: "synced"
          };
          batch.set(docRef, itemToSync);
        }

        await batch.commit();

        // Only update local items after successful batch commit
        for (const item of chunk) {
          await this.updateLocalItem(collection, item.id, {
            ...item,
            syncStatus: "synced",
            lastModified: Date.now(),
          });
        }
        this.updateSyncProgress(
          collection,
          ((i + chunk.length) / pendingItems.length) * 100
        );
      }
    } catch (error) {
      console.error(`Error syncing collection ${collection}:`, error);
      this.updateSyncState(collection, "error", error instanceof Error ? error : new Error(String(error)));
      throw error; // Propagate error up
    }
  }

  private async deleteLocalItem(collection: SyncableCollection, id: string) {
    switch (collection) {
      case "tasks":
        await db.deleteTask(id);
        break;
      case "folders":
        await db.deleteFolder(id);
        break;
      case "journal":
        await db.deleteEntry(id);
        break;
    }
  }

  private updateSyncProgress(collection: SyncableCollection, progress: number) {
    const state = this.syncState.get(collection)!;
    this.syncState.set(collection, {
      ...state,
      progress,
    });
  }

  async loadFromCache() {
    const collections: SyncableCollection[] = [
      "tasks",
      "folders",
      "journal",
      "pomodoro",
    ];

    for (const collection of collections) {
      try {
        console.log(`Starting initial sync for ${collection}`);
        
        // First check if we already have data
        const localData = await this.getLocalItems(collection);
        if (!localData || localData.length === 0) {
          console.log(`No local data found for ${collection}, syncing from Firestore`);
          await this.syncFromFirestore(collection);
          
          // Verify the sync was successful
          const syncedData = await this.getLocalItems(collection);
          console.log(`Successfully synced ${syncedData?.length || 0} items for ${collection}`);
        } else {
          console.log(`Found ${localData.length} existing items for ${collection}`);
        }
      } catch (error) {
        console.error(`Failed to sync ${collection} from Firestore:`, error);
      }
    }
  }

  private async getLocalItems(collection: SyncableCollection) {
    switch (collection) {
      case "tasks":
        return await db.tasks.toArray();
      case "folders": 
        return await db.folders.toArray();
      case "journal":
        return await db.journal.toArray();
      default:
        return [];
    }
  }

  removeAllListeners() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  getSyncState(collection: SyncableCollection): SyncState {
    return this.syncState.get(collection)!;
  }
}

export const syncService = SyncService.getInstance();
