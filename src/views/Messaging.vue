<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const SlideUpSheet = defineAsyncComponent(() => import('../components/SlideUpSheet.vue'))
const UserAvatar = defineAsyncComponent(() => import('../components/UserAvatar.vue'))
import { useConversationStore } from '../stores/conversationStore'

const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()

const { conversations, isLoading } = storeToRefs(conversationStore)
const { getCurrentUserId } = storeToRefs(authStore)

const showCreateModal = ref(false)
const newRecipientId = ref('')

// Theme support
const themes: Record<string, string> = {
  default: 'linear-gradient(160deg, #e8eaf6 0%, #c5cae9 50%, #b39ddb 100%)',
  sunset: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #ff8a80 100%)',
  ocean: 'linear-gradient(160deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  forest: 'linear-gradient(160deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)',
  midnight: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  rose: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #f8b4b4 100%)',
  aurora: 'linear-gradient(160deg, #a8edea 0%, #fed6e3 50%, #ffecd2 100%)',
  lavender: 'linear-gradient(160deg, #e0c3fc 0%, #8ec5fc 50%, #a1c4fd 100%)',
}

const currentTheme = ref(localStorage.getItem('messaging-theme') || 'default')
const backgroundStyle = computed(() => ({
  background: themes[currentTheme.value] || themes.default,
}))

const hasConversations = computed(() => conversationStore.hasConversations)
const currentUserId = computed(() => getCurrentUserId.value)

onMounted(async () => {
  await authStore.setUser()

  if (!currentUserId.value) {
    router.push('/login')
    return
  }

  await conversationStore.loadConversations(currentUserId.value)
})

onActivated(() => {
  currentTheme.value = localStorage.getItem('messaging-theme') || 'default'
})

function selectConversation(conversationId: string) {
  router.push(`/messaging/${conversationId}`)
}

async function createConversation() {
  if (!currentUserId.value)
    return

  const success = await conversationStore.createConversation(currentUserId.value, newRecipientId.value)

  if (success) {
    showCreateModal.value = false
    newRecipientId.value = ''
  }
}

function goToSettings() {
  router.push('/messaging/settings')
}

const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))
</script>

<template>
  <div class="messaging-bg" :style="backgroundStyle">
    <div class="messaging-header">
      <button class="back-btn" @click="router.push('/home')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <div class="chat-info">
        <span class="chat-title">Cutiegram chats</span>
      </div>
      <button class="menu-btn" aria-label="Settings" @click="goToSettings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" width="0.5rem">
          <path fill="currentColor" d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z" />
        </svg>
      </button>
    </div>

    <div class="messaging-container">
      <!-- Loading State -->
      <div v-if="isLoading && !conversations.length" class="loading-state">
        <p>Loading...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasConversations" class="empty-state">
        <div class="empty-state-content">
          <span class="empty-icon">💬</span>
          <h3>No conversations yet</h3>
          <p>Start chatting with friends!</p>
          <button class="create-btn" @click="showCreateModal = true">
            Start Conversation
          </button>
        </div>
      </div>

      <!-- Conversation List -->
      <div v-else class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          @click="selectConversation(conv.id)"
        >
          <UserAvatar
            :avatar-url="conv.otherUserAvatarUrl"
            :name="conv.otherUserName"
            :size="50"
          />
          <div class="conv-details">
            <span class="conv-name">{{ conv.otherUserName }}</span>
            <span class="conv-preview">Tap to chat</span>
          </div>
        </div>
        <FloatingActionButton aria-label="Start new chat" @click="showCreateModal = true" />
      </div>
    </div>

    <SlideUpSheet
      :show="showCreateModal"
      title="Start New Conversation"
      @close="showCreateModal = false"
    >
      <div class="input-group">
        <label for="userId">User ID</label>
        <input
          id="userId"
          v-model="newRecipientId"
          type="text"
          placeholder="Enter User ID to message..."
        >
      </div>
      <div class="button-group">
        <button type="button" class="cancel-btn" @click="showCreateModal = false">
          Cancel
        </button>
        <button type="button" class="submit-btn" @click="createConversation">
          Start Chat
        </button>
      </div>
    </SlideUpSheet>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.messaging-bg {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Inter', sans-serif;
  transition: background 0.3s ease;
}

.messaging-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.chat-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.back-btn, .menu-btn {
  background: none;
  border: none;
  color: #1a1a1a;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover, .menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.messaging-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: transparent;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  animation: fadeIn 0.6s ease-out;
}

.empty-state-content {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 6rem;
  display: block;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
}

.empty-state h3 {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.03em;
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.create-btn {
  background: linear-gradient(135deg, #8a4fff 0%, #6122e6 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px -5px rgba(138, 79, 255, 0.4);
  letter-spacing: 0.02em;
}

.create-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 15px 30px -5px rgba(138, 79, 255, 0.5);
}

.create-btn:active {
  transform: translateY(1px) scale(0.98);
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 5rem;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.conv-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.conv-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.conv-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
}

.conv-preview {
  font-size: 0.9rem;
  color: #6b7280;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.input-group input {
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  outline: none;
}

.input-group input:focus {
  border-color: #8a4fff;
  box-shadow: 0 0 0 4px rgba(138, 79, 255, 0.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: white;
  border: 2px solid #e5e7eb;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.submit-btn {
  background: linear-gradient(135deg, #8a4fff 0%, #6122e6 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(138, 79, 255, 0.3);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(138, 79, 255, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 480px) {
  .empty-icon {
    font-size: 5rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
  }
}
</style>
