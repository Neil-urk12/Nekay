// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAjkmkmixb-HR-Gyh5K6QYWXo6Kc2S8Q0",
  authDomain: "nekay-b4b50.firebaseapp.com",
  projectId: "nekay-b4b50",
  storageBucket: "nekay-b4b50.firebasestorage.app",
  messagingSenderId: "833816673115",
  appId: "1:833816673115:web:2b51df86efd3f4bfeb787e",
  measurementId: "G-YJHYN5NKJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const tasksCollection = collection(db, 'tasks');
export const journalEntriesCollection = collection(db, 'journalEntries');
export const foldersCollection = collection(db, 'folders');

export const getTasks = async (): Promise<any[]> => {
  const querySnapshot = await getDocs(tasksCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addTask = async (taskData: any) => {
  await addDoc(tasksCollection, taskData);
};

export const updateTask = async (taskId: string, taskData: any) => {
  const taskDocRef = doc(db, 'tasks', taskId);
  await updateDoc(taskDocRef, taskData);
};

export const deleteTask = async (taskId: string) => {
  const taskDocRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskDocRef);
};

export const getJournalEntries = async (): Promise<any[]> => {
  const querySnapshot = await getDocs(journalEntriesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addJournalEntry = async (entryData: any) => {
  await addDoc(journalEntriesCollection, entryData);
};

export const updateJournalEntry = async (entryId: string, entryData: any) => {
  const entryDocRef = doc(db, 'journalEntries', entryId);
  await updateDoc(entryDocRef, entryData);
};

export const deleteJournalEntry = async (entryId: string) => {
  const entryDocRef = doc(db, 'journalEntries', entryId);
  await deleteDoc(entryDocRef);
};

export const getFolders = async (): Promise<any[]> => {
  const querySnapshot = await getDocs(foldersCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addFolder = async (folderData: any) => {
  await addDoc(foldersCollection, folderData);
};

export const updateFolder = async (folderId: string, folderData: any) => {
  const folderDocRef = doc(db, 'folders', folderId);
  await updateDoc(folderDocRef, folderData);
};

export const deleteFolder = async (folderId: string) => {
  const folderDocRef = doc(db, 'folders', folderId);
  await deleteDoc(folderDocRef);
};
