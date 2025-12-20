<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useConversationStore } from '../stores/conversationStore'

const ConfirmationModal = defineAsyncComponent(() => import('../components/ConfirmationModal.vue'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const { currentConversation, error: storeError } = storeToRefs(conversationStore)

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const localError = ref<string | null>(null)

// Modal state
const showSuccessModal = ref(false)
const showFileSizeModal = ref(false)
const showRemoveConfirmModal = ref(false)

const currentBackground = computed(() => {
  if (previewUrl.value)
    return previewUrl.value
  return currentConversation.value?.backgroundUrl
})

onMounted(async () => {
  if (!currentConversation.value) {
    await authStore.setUser()
    const currentUserId = authStore.getCurrentUserId
    if (currentUserId) {
      await conversationStore.loadConversations(currentUserId)
      const conversationId = route.params.id as string
      const conv = conversationStore.conversations.find(c => c.id === conversationId)
      if (conv) {
        conversationStore.selectConversation(conv, currentUserId)
      }
      else {
        localError.value = 'Conversation not found'
      }
    }
    else {
      router.push('/login')
    }
  }
})

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showFileSizeModal.value = true
      return
    }

    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

async function uploadBackground() {
  localError.value = null
  if (!selectedFile.value)
    return

  if (!currentConversation.value) {
    localError.value = 'Conversation not loaded. Please refresh.'
    return
  }

  isUploading.value = true
  try {
    const success = await conversationStore.uploadConversationBackground(
      selectedFile.value,
      currentConversation.value.id,
    )
    if (success) {
      previewUrl.value = null
      selectedFile.value = null
      showSuccessModal.value = true
    }
  }
  catch (err) {
    console.error(err)
    localError.value = 'An unexpected error occurred'
  }
  finally {
    isUploading.value = false
  }
}

function confirmRemoveBackground() {
  showRemoveConfirmModal.value = true
}

async function doRemoveBackground() {
  showRemoveConfirmModal.value = false
  if (!currentConversation.value)
    return

  try {
    await conversationStore.removeConversationBackground(currentConversation.value.id)
    previewUrl.value = null
    selectedFile.value = null
  }
  catch (e) {
    console.error(e)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <button class="back-btn" @click="router.back()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <h2 class="settings-title">
        Conversation Settings
      </h2>
    </div>

    <div v-if="localError || storeError" class="error-banner">
      {{ localError || storeError }}
    </div>

    <div class="settings-content">
      <div class="preview-section">
        <label>Current Background Preview</label>
        <div
          class="preview-box"
          :style="currentBackground ? { backgroundImage: `url(${currentBackground})` } : {}"
        >
          <div v-if="!currentBackground" class="no-bg-text">
            No custom background set
          </div>
          <div class="mock-messages">
            <div class="mock-msg other">
              Hello!
            </div>
            <div class="mock-msg self">
              Hi there 👋
            </div>
          </div>

          <!-- Loading overlay -->
          <div v-if="isUploading" class="upload-overlay">
            <span class="overlay-spinner" />
          </div>
        </div>
      </div>

      <div class="actions-section">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleFileSelect"
        >

        <div v-if="selectedFile" class="confirm-actions">
          <button
            class="action-btn primary"
            :disabled="isUploading"
            @click="uploadBackground"
          >
            <span v-if="isUploading" class="btn-spinner" />
            {{ isUploading ? 'Uploading...' : 'Save Background' }}
          </button>
          <button
            class="action-btn secondary"
            :disabled="isUploading"
            @click="() => { selectedFile = null; previewUrl = null }"
          >
            Cancel
          </button>
        </div>

        <div v-else class="main-actions">
          <button class="action-btn primary" @click="triggerFileInput">
            Choose Image
          </button>

          <button
            v-if="currentConversation?.backgroundUrl"
            class="action-btn danger"
            @click="confirmRemoveBackground"
          >
            Remove Background
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <ConfirmationModal
      :show="showSuccessModal"
      title="Success!"
      message="Background updated successfully."
      confirm-text="OK"
      cancel-text=""
      @close="showSuccessModal = false"
      @confirm="showSuccessModal = false"
    />

    <!-- File Size Error Modal -->
    <ConfirmationModal
      :show="showFileSizeModal"
      title="File Too Large"
      message="File size must be less than 5MB."
      confirm-text="OK"
      cancel-text=""
      variant="warning"
      @close="showFileSizeModal = false"
      @confirm="showFileSizeModal = false"
    />

    <!-- Remove Confirmation Modal -->
    <ConfirmationModal
      :show="showRemoveConfirmModal"
      title="Remove Background?"
      message="Are you sure you want to remove the custom background?"
      confirm-text="Remove"
      cancel-text="Cancel"
      variant="danger"
      @close="showRemoveConfirmModal = false"
      @confirm="doRemoveBackground"
    />
  </div>
</template>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.error-banner {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem;
  text-align: center;
  font-weight: 500;
  border-bottom: 1px solid #fecaca;
}

/* Spinner */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  gap: 1rem;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: #f1f5f9;
}

.settings-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.settings-content {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.preview-section {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.preview-section label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 1rem;
}

.preview-box {
  height: 300px;
  border-radius: 12px;
  background-color: #e2e8f0;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
  border: 1px solid rgba(0,0,0,0.1);
}

.no-bg-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #94a3b8;
  font-style: italic;
}

.mock-messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mock-msg {
  padding: 0.75rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  width: fit-content;
  max-width: 80%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.mock-msg.other {
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

.mock-msg.self {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hidden-input {
  display: none;
}

.action-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35);
}

.action-btn.secondary {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  margin-top: 0.75rem;
}

.action-btn.danger {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fee2e2;
}

.action-btn.danger:hover {
  background: #fee2e2;
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.confirm-actions, .main-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
