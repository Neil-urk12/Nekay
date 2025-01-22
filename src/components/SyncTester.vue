<template>
  <div class="sync-tester">
    <h2>Sync Service Tester</h2>

    <!-- Status Display -->
    <div class="sync-status">
      <h3>Sync Status:</h3>
      <div
        v-for="(state, collection) in syncStates"
        :key="collection"
        class="status-item"
        :class="state.status"
      >
        {{ collection }}: {{ state.status }}
        <div v-if="state.error" class="error">
          Error: {{ state.error.message }}
        </div>
        <div v-if="state.status === 'syncing'" class="progress">
          Progress: {{ state.progress }}%
        </div>
      </div>
    </div>

    <!-- Test Actions -->
    <div class="test-actions">
      <button @click="createPendingTask">Create Pending Task</button>
      <button @click="createPendingFolder">Create Pending Folder</button>
      <button @click="triggerSync">Trigger Sync</button>
      <button @click="refreshData">Refresh Data</button>
      <button @click="toggleConnection">
        {{ isOnline ? "Go Offline" : "Go Online" }}
      </button>
    </div>

    <!-- Data Comparison -->
    <div class="data-comparison">
      <div class="local-data">
        <h3>Local Data (IndexedDB):</h3>
        <div v-for="(items, type) in localData" :key="type">
          <h4>{{ type }} ({{ items.length }})</h4>
          <pre>{{ JSON.stringify(items, null, 2) }}</pre>
        </div>
      </div>

      <div class="remote-data">
        <h3>Remote Data (Firestore):</h3>
        <div v-for="(items, type) in remoteData" :key="type">
          <h4>{{ type }} ({{ items.length }})</h4>
          <pre>{{ JSON.stringify(items, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="js">
import { ref, onMounted, computed, watch } from "vue";
import { syncService } from "../services/syncService";
import { db } from "../services/indexedDB";
import { db as fireDb } from "../firebase/firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { generateUUID } from "../utils/functions";

const syncStates = ref({
  tasks: syncService.getSyncState("tasks"),
  folders: syncService.getSyncState("folders"),
  journal: syncService.getSyncState("journal"),
  pomodoro: syncService.getSyncState("pomodoro"),
});

const localData = ref({
  tasks: [],
  folders: [],
  journal: [],
});

const remoteData = ref({
  tasks: [],
  folders: [],
  journal: [],
});

const isOnline = computed(() => navigator.onLine);

async function createPendingTask() {
  const task = {
    id: generateUUID(),
    taskContent: `Test Task ${Date.now()}`,
    completed: false,
    syncStatus: "pending",
    lastModified: Date.now(),
    timestamp: Date.now(),
  };

  await db.createTask(task);
  await refreshLocalData();
}

async function createPendingFolder() {
  const folder = {
    id: generateUUID(),
    name: `Test Folder ${Date.now()}`,
    type: "task",
    syncStatus: "pending",
    lastModified: Date.now(),
    timestamp: Date.now(),
    numOfItems: 0,
  };

  await db.createFolder(folder);
  await refreshLocalData();
}

async function triggerSync() {
  await syncService.syncAll();
  await refreshData();
}

function toggleConnection() {
  // Simulate network status change
  const newStatus = !isOnline.value;
  Object.defineProperty(navigator, "onLine", {
    value: newStatus,
    configurable: true,
  });
  window.dispatchEvent(new Event(newStatus ? "online" : "offline"));
  refreshData();
}

async function refreshLocalData() {
  localData.value = {
    tasks: await db.getTasks(),
    folders: await db.getFolders(),
    journal: await db.getEntries(),
  };
}

async function refreshRemoteData() {
  try {
    const collections = ["tasks", "folders", "entries"];
    const fetchPromises = collections.map(async (collectionName) => {
      const snapshot = await getDocs(collection(fireDb, collectionName));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    });

    const [tasks, folders, entries] = await Promise.all(fetchPromises);

    remoteData.value = {
      tasks,
      folders,
      journal: entries,
    };
  } catch (error) {
    console.error("Error fetching remote data:", error);
  }
}

async function refreshData() {
  await Promise.all([refreshLocalData(), refreshRemoteData()]);
}

// Set up watchers for sync state changes
watch(
  syncStates,
  () => {
    refreshData();
  },
  { deep: true }
);

// Initial setup
onMounted(async () => {
  await refreshData();
});
</script>

<style scoped>
.sync-tester {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.sync-status {
  margin: 20px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.status-item {
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
}

.status-item.synced {
  background-color: #e6ffe6;
}

.status-item.syncing {
  background-color: #e6f3ff;
}

.status-item.error {
  background-color: #ffe6e6;
}

.test-actions {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.test-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}

.data-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.local-data,
.remote-data {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-size: 12px;
}

.error {
  color: red;
}

.progress {
  color: blue;
  font-size: 0.9em;
}
</style>
