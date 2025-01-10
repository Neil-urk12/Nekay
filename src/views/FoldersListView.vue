<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotesStore } from "../stores/notes";

const router = useRouter();
const noteStore = useNotesStore();

const newFolderName = ref("");
const editingFolder = ref<{ id: string; name: string } | null>(null);
const deleteConfirm = ref<{ id: string; name: string } | null>(null);

const folders = computed(() => noteStore.getFolders);
// const folders = computed(() => noteStore.folders);

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
            <button class="icon-btn" @click.stop="saveEdit">✅</button>
            <button class="icon-btn" @click.stop="cancelEdit">❌</button>
          </template>
          <template v-else>
            <button
              class="icon-btn"
              @click.stop="editingFolder = { id: folder.id, name: folder.name }"
            >
              ✏️
            </button>
            <button
              class="icon-btn"
              @click.stop="deleteConfirm = { id: folder.id, name: folder.name }"
            >
              🗑️
            </button>
          </template>
        </div>
        <span class="arrow">→</span>
      </div>
    </div>
    <div v-if="deleteConfirm" @click="cancelDelete" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <h3>Delete Folder</h3>
        <p>Are you sure you want to delete " {{ deleteConfirm.name }} "</p>
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
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  font-size: 1rem;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  color: white;
  font-weight: bold;
}
.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
