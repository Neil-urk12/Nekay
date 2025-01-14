import { defineStore } from "pinia";
import { generateUUID } from "../utils/functions";
import { collection, deleteDoc, doc, getDocs, setDoc} from "firebase/firestore";
import { db as fireDb } from "../firebase/firebase-config";
import { db, WaterEntry } from "../services/indexedDB";

export const useWaterStore = defineStore("waterTracker", {
  state: () => ({
    waterEntries: [] as WaterEntry[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getWaterEntries: (state) => state.waterEntries,
  },

  actions: {
    setError(error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      console.error("Water Store error:", error);
    },

    async loadWaterEntries() {
      try {
        this.loading = true;
        if (navigator.onLine) {
          const querySnapshot = await getDocs(collection(fireDb, "waterEntries"));
          this.waterEntries = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as WaterEntry[];
        } else {
          this.waterEntries = await db.getWaterEntries();
        }
      } catch (err) {
        this.setError(err);
      } finally {
        this.loading = false;
      }
    },

    async addWaterEntry(entry: { amount: number; date: string;}) {
      try {
        const timestamp = Date.now();
        const newEntry: WaterEntry = {
          id: generateUUID(),
          amount: entry.amount,
          date: entry.date,
          timestamp: timestamp,
          syncStatus: "pending",
          lastModified: timestamp,
        };

        if (navigator.onLine) {
          newEntry.syncStatus = "synced";
          const docRef = doc(fireDb, "waterEntries", newEntry.id);
          await setDoc(docRef, newEntry);
          await db.createWaterEntry(newEntry);
        } else {
          await db.createWaterEntry(newEntry);
        }

        this.waterEntries = [...this.waterEntries, newEntry];
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteWaterEntry(entryId: string) {
      try {
        const entryIndex = this.waterEntries.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) throw new Error("Water entry not found");

        if (navigator.onLine) {
          await deleteDoc(doc(fireDb, "waterEntries", entryId));
          await db.deleteWaterEntry(entryId);
        } else {
          await db.deleteWaterEntry(entryId);
        }

        this.waterEntries.splice(entryIndex, 1);
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },
  },
});
