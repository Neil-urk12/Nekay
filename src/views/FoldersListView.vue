<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotesStore } from "../stores/notes";

const router = useRouter();
const noteStore = useNotesStore();

const newFolderName = ref("");
const editingFolder = ref<{ id: string; name: string } | null>(null);
const deleteConfirm = ref<{ id: string; name: string } | null>(null);

const folders = computed(() => [...noteStore.getFolders.filter((folder) => folder.type === "task")]);

const navigateToFolder = (folderId: string) => {
  router.push(`/folders/${folderId}`);
};

const addFolder = async () => {
  if (!newFolderName.value.trim()) return;
  try {
    await noteStore.addFolder(newFolderName.value, "task");
    newFolderName.value = "";
  } catch (error) {
    console.error("Failed to add folder:", error);
  }
};

const saveEdit = async () => {
  if (!editingFolder.value) return;

  try {
    await noteStore.editFolder(editingFolder.value.id, {
      name: editingFolder.value.name,
    });
    editingFolder.value = null;
  } catch (err) {
    console.error("Failed to edit folder: ", err);
  }
};

const cancelEdit = () => {
  editingFolder.value = null;
};

const confirmDelete = async () => {
  if (!deleteConfirm.value) return;

  try {
    await noteStore.deleteFolder(deleteConfirm.value.id);
    deleteConfirm.value = null;
  } catch (err) {
    console.error("Failed to delete folder: ", err);
  }
};

const cancelDelete = () => {
  deleteConfirm.value = null;
};

onMounted(() => {
  if (folders.value.length === 0) noteStore.loadFolders();
});
</script>

<template>
  <div class="folders-view">
    <header class="page-header">
      <h1>My Folders</h1>
      <div class="add-folder">
        <input
          v-model="newFolderName"
          placeholder="New folder name"
          @keyup.enter="addFolder"
        />
        <button @click="addFolder" class="btn-primary">Add Folder</button>
      </div>
    </header>

    <div class="folders-list">
      <!-- All Tasks Folder -->
      <div class="folder-card" @click="router.push('/tasks')">
        <div class="folder-info">
          <h2>All Tasks</h2>
          <p>View all your tasks</p>
        </div>
        <span class="arrow">→</span>
      </div>

      <!-- User Created Folders -->
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="folder-card"
        @click="navigateToFolder(folder.id)"
      >
        <div class="folder-info">
          <template v-if="editingFolder?.id === folder.id">
            <input
              v-model="editingFolder.name"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
              @click.stop
              class="edit-input"
            />
          </template>
          <template v-else>
            <h2 class="folder-name">{{ folder.name }}</h2>
            <p class="folder-count">{{ folder.numOfItems || 0 }} tasks</p>
          </template>
        </div>

        <div class="folder-actions">
          <template v-if="editingFolder?.id === folder.id">
            <button class="icon-btn" @click.stop="saveEdit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="1.2rem"
              >
                <path
                  fill="#63E6BE"
                  d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                />
              </svg>
            </button>
            <button class="icon-btn" @click.stop="cancelEdit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                width="1.2rem"
              >
                <path
                  fill="#f66151"
                  d="M378.4 71.4c8.5-10.1 7.2-25.3-2.9-33.8s-25.3-7.2-33.8 2.9L192 218.7 42.4 40.6C33.9 30.4 18.7 29.1 8.6 37.6S-2.9 61.3 5.6 71.4L160.7 256 5.6 440.6c-8.5 10.2-7.2 25.3 2.9 33.8s25.3 7.2 33.8-2.9L192 293.3 341.6 471.4c8.5 10.2 23.7 11.5 33.8 2.9s11.5-23.7 2.9-33.8L223.3 256l155-184.6z"
                />
              </svg>
            </button>
          </template>
          <template v-else>
            <button
              class="icon-btn"
              @click.stop="editingFolder = { id: folder.id, name: folder.name }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                width="1.2rem"
              >
                <path
                  fill="#B197FC"
                  d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"
                />
              </svg>
            </button>
            <button
              class="icon-btn"
              @click.stop="deleteConfirm = { id: folder.id, name: folder.name }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="1.2rem"
              >
                <path
                  fill="#a51d2d"
                  d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                />
              </svg>
            </button>
          </template>
        </div>
        <span class="arrow">→</span>
      </div>
    </div>
    <div v-if="deleteConfirm" @click="cancelDelete" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Delete Folder</h3>
          <button class="close-btn" @click="cancelDelete">×</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete "<span class="folder-highlight">{{
              deleteConfirm.name
            }}</span
            >"?
          </p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn-secondary">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folders-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}
.folder-name {
  color: #1a1c1e;
}
.folder-count {
  color: #5c5e61;
}
.page-header {
  margin-bottom: 2rem;
}
.add-folder {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.folders-list {
  display: grid;
  gap: 1rem;
}
.folder-card {
  background: rgba(242, 243, 247, 0.427);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}
.folder-card:hover {
  border-color: #2196f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.folder-info {
  flex: 1;
  min-width: 0;
  margin-right: 1rem;
}
.folder-info h2 {
  margin: 0;
  font-size: 1.25rem;
  word-break: break-word;
  overflow-wrap: break-word;
}
.folder-info p {
  margin: 0.25rem 0 0;
  color: var(--text-secondary);
}
.folder-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.arrow {
  font-size: 1.5rem;
  margin-left: 1rem;
  color: black;
  flex-shrink: 0;
}
.edit-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid palevioletred;
  background: none;
  border-radius: 4px;
  font-size: 1rem;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: rgba(255, 245, 246, 0.594);
  padding: 0;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.3s ease-out;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1c1e;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
}

.warning-text {
  margin-top: 0.75rem !important;
  color: #dc3545;
  font-size: 1rem !important;
  font-weight: 600;
}

.folder-highlight {
  font-weight: 600;
  color: #1a1c1e;
}

.modal-actions {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
}
.btn-primary {
  color: white;
  font-weight: bold;
}

.btn-secondary {
  background: #f8f9fa;
  color: #1a1c1e;
  border: 1px solid #dee2e6;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
}
.icon-btn {
  background: none;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 0;
}
</style>
