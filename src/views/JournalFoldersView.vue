<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Folder } from "../composables/interfaces";
import { useNotesStore } from "../stores/notes";
const AddFolderModal = defineAsyncComponent(
  () => import("../components/AddFolderModal.vue")
);
const EditFolderModal = defineAsyncComponent(
  () => import("../components/EditFolderModal.vue")
);
const DeleteConfirmModal = defineAsyncComponent(
  () => import("../components/DeleteConfirmModal.vue")
);

const router = useRouter();
const journalStore = useNotesStore();

const showAddFolderModal = ref(false);
const showEditFolderModal = ref(false);
const showDeleteModal = ref(false);
const selectedFolder = ref<Folder | null>(null);
const folderToDelete = ref<Folder | null>(null);

const folders = computed(() => [
  ...journalStore.getFolders.filter((folder) => folder.type === "journal"),
]);

const addFolder = async (folderName: string) => {
  try {
    if (!folderName.trim()) return;

    await journalStore.addFolder(folderName, "journal");

    await journalStore.loadFolders();
  } catch (err) {
    console.error(err);
  }
};

const editFolder = async (updatedFolder: Partial<Folder>) => {
  try {
    if (!updatedFolder || !updatedFolder.id) return;

    await journalStore.editFolder(updatedFolder.id, {
      name: updatedFolder.name,
    });
  } catch (err) {
    console.error("Error editing folder", err);
  }
};

const openDeleteModal = (folder: Folder) => {
  folderToDelete.value = folder;
  showDeleteModal.value = true;
};

const deleteFolder = async () => {
  try {
    if (!folderToDelete.value || !folderToDelete.value.id) return;

    await journalStore.deleteFolder(folderToDelete.value.id);

    showDeleteModal.value = false;
    folderToDelete.value = null;
    await journalStore.loadFolders();
  } catch (err) {
    console.error("Error deleting folder:", err);
  }
};

const openEditModal = (folder: Folder) => {
  selectedFolder.value = folder;
  showEditFolderModal.value = true;
};

const navigateToFolder = (folder: Folder) =>
  router.push(`/folder/${folder.id}`);

onMounted(() => {
  if (folders.value.length === 0) journalStore.loadFolders();
});
</script>

<template>
  <div class="journal-container">
    <div class="journal-header">
      <h1>My Journal</h1>
      <button class="add-folder-button" @click="showAddFolderModal = true">
        Add Folder
      </button>
    </div>

    <div class="journal-folder-list">
      <div
        class="journal-folder"
        v-for="folder in folders"
        :key="folder.id"
        @click="navigateToFolder(folder)"
      >
        <div class="folderInfo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width="1rem"
          >
            <path
              fill="#000000"
              d="M0 96C0 60.7 28.7 32 64 32l132.1 0c19.1 0 37.4 7.6 50.9 21.1L289.9 96 448 96c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-256c0-8.8-7.2-16-16-16l-161.4 0c-10.6 0-20.8-4.2-28.3-11.7L213.1 87c-4.5-4.5-10.6-7-17-7L64 80z"
            />
          </svg>
          <h2>{{ folder.name }}</h2>
        </div>
        <div class="folder-actions">
          <button class="editFolder" @click.stop="openEditModal(folder)">
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
          <button class="deleteFolder" @click.stop="openDeleteModal(folder)">
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
        </div>
      </div>
    </div>
    <AddFolderModal
      v-if="showAddFolderModal"
      @close="showAddFolderModal = false"
      @folderName="addFolder"
    />
    <EditFolderModal
      v-if="showEditFolderModal"
      :folder="selectedFolder"
      @close="showEditFolderModal = false"
      @editFolder="editFolder"
    />
    <DeleteConfirmModal
      v-if="showDeleteModal"
      :folder-name="folderToDelete?.name"
      @close="showDeleteModal = false"
      @confirm="deleteFolder"
    />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  font-family: "Concert One", "Montserrat", sans-serif;
}

.journal-container {
  background: rgb(255, 255, 255);
  min-height: 90vh;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h1 {
  color: rgb(219, 39, 119);
}

.add-folder-button {
  background: rgb(219, 39, 119);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 5px;
  cursor: pointer;
}

.add-folder-button:hover {
  background: white;
  color: rgb(219, 39, 119);
  border: 1px solid rgb(219, 39, 119);
}

.journal-folder h2 {
  font-size: 1.2rem;
  margin-left: 1rem;
}

.journal-folder {
  display: flex;
  align-items: center;
  padding: 1rem;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 0.2rem 0;
}

.folderInfo {
  display: flex;
  align-items: center;
}

.journal-folder:hover {
  background-color: rgba(219, 39, 119, 0.1);
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.folder-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
  position: relative;
  z-index: 2;
}

.folder-actions button {
  background: none;
  padding: 0 0.5rem;
  z-index: 1;
}

.folder-actions button:hover {
  opacity: 0.8;
  transform: scale(1.1);
}
</style>
