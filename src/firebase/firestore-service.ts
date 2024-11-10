import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { Task, JournalEntry, Folder } from '../stores/notes';
import { app } from './firebase-config';

const db = getFirestore(app);

export const storeTask = async (task: Task) => {
  try {
    await addDoc(collection(db, 'tasks'), task);
    console.log('Task stored successfully!');
  } catch (error) {
    console.error('Error storing task:', error);
  }
};

export const storeJournalEntry = async (entry: JournalEntry) => {
  try {
    await addDoc(collection(db, 'journalEntries'), entry);
    console.log('Journal entry stored successfully!');
  } catch (error) {
    console.error('Error storing journal entry:', error);
  }
};

export const storeFolder = async (folder: Folder) => {
  try {
    await addDoc(collection(db, 'folders'), folder);
    console.log('Folder stored successfully!');
  } catch (error) {
    console.error('Error storing folder:', error);
  }
};

export const getTasks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ ...doc.data(), id: doc.id } as Task);
    });
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const getJournalEntries = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'journalEntries'));
    const journalEntries: JournalEntry[] = [];
    querySnapshot.forEach((doc) => {
      journalEntries.push({ ...doc.data(), id: doc.id } as JournalEntry);
    });
    return journalEntries;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
};

export const getFolders = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'folders'));
    const folders: Folder[] = [];
    querySnapshot.forEach((doc) => {
      folders.push({ ...doc.data(), id: doc.id } as Folder);
    });
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};
