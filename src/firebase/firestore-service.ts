import { 
  getFirestore, 
  collection,
  getDocs, 
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  setDoc,
  Timestamp,
  writeBatch,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { Task, JournalEntry, Folder } from '../stores/notes';
import { PomodoroStats } from '../stores/pomodoro';
import { app } from './firebase-config';

const db = getFirestore(app);

// Helper function to create a typed collection reference
function getTypedCollection<T>(collectionName: string): CollectionReference<T> {
  return collection(db, collectionName) as CollectionReference<T>;
}

export interface SyncMetadata {
  lastModified: number;
  deleted?: boolean;
}

export type WithMetadata<T> = T & SyncMetadata;

// Helper function to convert Firestore data to our type
function convertFirestoreData<T extends { id?: string }>(
  doc: DocumentData,
  docId: string
): WithMetadata<T> {
  const data = doc as T;
  return {
    ...data,
    id: docId,
    lastModified: doc.lastModified?.toMillis() || Date.now()
  } as WithMetadata<T>;
}

export const storeTask = async (task: WithMetadata<Task>) => {
  if (!task.id) {
    throw new Error('Task must have an id');
  }
  try {
    const docRef = doc(getTypedCollection<Task>('tasks'), task.id);
    await setDoc(docRef, {
      ...task,
      lastModified: Timestamp.fromMillis(task.lastModified)
    }, { merge: true });
  } catch (error) {
    console.error('Error storing task:', error);
    throw error;
  }
};

export const storeJournalEntry = async (entry: WithMetadata<JournalEntry>) => {
  if (!entry.id) {
    throw new Error('Journal entry must have an id');
  }
  try {
    const docRef = doc(getTypedCollection<JournalEntry>('journalEntries'), entry.id);
    await setDoc(docRef, {
      ...entry,
      lastModified: Timestamp.fromMillis(entry.lastModified)
    }, { merge: true });
  } catch (error) {
    console.error('Error storing journal entry:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    const docRef = doc(getTypedCollection<Task>('tasks'), taskId);
    await updateDoc(docRef, {
      ...updates,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const updateJournalEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
  try {
    const docRef = doc(getTypedCollection<JournalEntry>('journalEntries'), entryId);
    await updateDoc(docRef, {
      ...updates,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const docRef = doc(getTypedCollection<Task>('tasks'), taskId);
    await updateDoc(docRef, {
      deleted: true,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const deleteJournalEntry = async (entryId: string) => {
  try {
    const docRef = doc(getTypedCollection<JournalEntry>('journalEntries'), entryId);
    await updateDoc(docRef, {
      deleted: true,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
};

export const storeFolder = async (folder: WithMetadata<Folder>) => {
  if (!folder.id) {
    throw new Error('Folder must have an id');
  }
  try {
    const docRef = doc(getTypedCollection<Folder>('folders'), folder.id);
    await setDoc(docRef, {
      ...folder,
      lastModified: Timestamp.fromMillis(folder.lastModified)
    }, { merge: true });
  } catch (error) {
    console.error('Error storing folder:', error);
    throw error;
  }
};

export const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
  try {
    const docRef = doc(getTypedCollection<Folder>('folders'), folderId);
    await updateDoc(docRef, {
      ...updates,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

export const deleteFolder = async (folderId: string) => {
  try {
    const docRef = doc(getTypedCollection<Folder>('folders'), folderId);
    await updateDoc(docRef, {
      deleted: true,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

export const storePomodoroStats = async (stats: WithMetadata<PomodoroStats>) => {
  if (!stats.id) {
    throw new Error('Pomodoro stats must have an id');
  }
  try {
    const docRef = doc(getTypedCollection<PomodoroStats>('pomodoroStats'), stats.id);
    await setDoc(docRef, {
      ...stats,
      lastModified: Timestamp.fromMillis(stats.lastModified)
    }, { merge: true });
  } catch (error) {
    console.error('Error storing pomodoro stats:', error);
    throw error;
  }
};

export const updatePomodoroStats = async (statsId: string, updates: Partial<PomodoroStats>) => {
  try {
    const docRef = doc(getTypedCollection<PomodoroStats>('pomodoroStats'), statsId);
    await updateDoc(docRef, {
      ...updates,
      lastModified: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating pomodoro stats:', error);
    throw error;
  }
};

export const getChangedItems = async <T extends { id?: string }>(
  collectionName: string,
  since: number
): Promise<WithMetadata<T>[]> => {
  try {
    const collectionRef = getTypedCollection<T>(collectionName);
    const q = query(
      collectionRef,
      where('lastModified', '>', Timestamp.fromMillis(since)),
      orderBy('lastModified', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const items: WithMetadata<T>[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push(convertFirestoreData<T>(data, doc.id));
    });
    
    return items;
  } catch (error) {
    console.error(`Error fetching changed ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Types for batch operations
 */
export interface BatchUpdateOperations {
  /**
   * Tasks to update
   */
  tasks?: WithMetadata<Task>[];
  /**
   * Folders to update
   */
  folders?: WithMetadata<Folder>[];
  /**
   * Journal entries to update
   */
  journalEntries?: WithMetadata<JournalEntry>[];
  /**
   * Task IDs to mark as deleted
   */
  deletedTaskIds?: string[];
  /**
   * Folder IDs to mark as deleted
   */
  deletedFolderIds?: string[];
  /**
   * Journal entry IDs to mark as deleted
   */
  deletedJournalEntryIds?: string[];
  /**
   * Pomodoro stats to update
   */
  pomodoroStats?: WithMetadata<PomodoroStats>[];
  /**
   * Pomodoro stats IDs to mark as deleted
   */
  deletedPomodoroStatsIds?: string[];
}

/**
 * Batch update multiple items
 * 
 * @param operations Batch update operations
 */
export const batchUpdate = async (operations: BatchUpdateOperations) => {
  const batch = writeBatch(db);
  const timestamp = Timestamp.now();

  try {
    // Handle tasks
    operations.tasks?.forEach(task => {
      if (!task.id) {
        console.warn('Skipping task without id:', task);
        return;
      }
      const docRef = doc(getTypedCollection<Task>('tasks'), task.id);
      batch.set(docRef, {
        ...task,
        lastModified: timestamp
      }, { merge: true });
    });

    // Handle journal entries
    operations.journalEntries?.forEach(entry => {
      if (!entry.id) {
        console.warn('Skipping journal entry without id:', entry);
        return;
      }
      const docRef = doc(getTypedCollection<JournalEntry>('journalEntries'), entry.id);
      batch.set(docRef, {
        ...entry,
        lastModified: timestamp
      }, { merge: true });
    });

    // Handle folders
    operations.folders?.forEach(folder => {
      if (!folder.id) {
        console.warn('Skipping folder without id:', folder);
        return;
      }
      const docRef = doc(getTypedCollection<Folder>('folders'), folder.id);
      batch.set(docRef, {
        ...folder,
        lastModified: timestamp
      }, { merge: true });
    });

    // Handle pomodoro stats
    operations.pomodoroStats?.forEach(stats => {
      if (!stats.id) {
        console.warn('Skipping pomodoro stats without id:', stats);
        return;
      }
      const docRef = doc(getTypedCollection<PomodoroStats>('pomodoroStats'), stats.id);
      batch.set(docRef, {
        ...stats,
        lastModified: timestamp
      }, { merge: true });
    });

    // Handle deleted tasks
    operations.deletedTaskIds?.forEach(taskId => {
      const docRef = doc(getTypedCollection<Task>('tasks'), taskId);
      batch.update(docRef, {
        deleted: true,
        lastModified: timestamp
      });
    });

    // Handle deleted journal entries
    operations.deletedJournalEntryIds?.forEach(entryId => {
      const docRef = doc(getTypedCollection<JournalEntry>('journalEntries'), entryId);
      batch.update(docRef, {
        deleted: true,
        lastModified: timestamp
      });
    });

    // Handle deleted folders
    operations.deletedFolderIds?.forEach(folderId => {
      const docRef = doc(getTypedCollection<Folder>('folders'), folderId);
      batch.update(docRef, {
        deleted: true,
        lastModified: timestamp
      });
    });

    // Handle deleted pomodoro stats
    operations.deletedPomodoroStatsIds?.forEach(statsId => {
      const docRef = doc(getTypedCollection<PomodoroStats>('pomodoroStats'), statsId);
      batch.update(docRef, {
        deleted: true,
        lastModified: timestamp
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};
export type { Task, Folder, JournalEntry, PomodoroStats };
