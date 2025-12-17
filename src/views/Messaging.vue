<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AddModal from '../components/AddModal.vue'
import { useAuthStore } from '../stores/authStore'
import { useConversationStore } from '../stores/conversationStore'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()

// Store refs
const { conversations, currentConversation, messages, isLoading, error } = storeToRefs(conversationStore)
const { getCurrentUserId } = storeToRefs(authStore)

const newMessage = ref('')
const messageTimestampsVisible = ref<{ [key: string]: boolean }>({})

// refs for auto-scroll and input focus
const scrollerRef = ref<any>(null)
const inputRef = ref<HTMLInputElement | null>(null)

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

// Computed
const hasConversations = computed(() => conversationStore.hasConversations)
const currentUserId = computed(() => getCurrentUserId.value)

// Group messages by date
const groupedMessages = computed(() => {
  const groups: { date: string, messages: typeof messages.value }[] = []
  let currentDate = ''

  messages.value.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })

    if (msgDate !== currentDate) {
      currentDate = msgDate
      groups.push({ date: msgDate, messages: [msg] })
    }
    else {
      groups[groups.length - 1].messages.push(msg)
    }
  })

  return groups
})

// Check if message is first/last in a group from same sender
function isFirstInGroup(msgList: typeof messages.value, index: number) {
  if (index === 0)
    return true
  return msgList[index - 1].isSelf !== msgList[index].isSelf
}

function isLastInGroup(msgList: typeof messages.value, index: number) {
  if (index === msgList.length - 1)
    return true
  return msgList[index + 1].isSelf !== msgList[index].isSelf
}

// Initialize messaging
onMounted(async () => {
  await authStore.setUser()

  if (!currentUserId.value) {
    router.push('/login')
    return
  }

  // Load conversations - will skip if already loaded
  await conversationStore.loadConversations(currentUserId.value)
})

// Reload theme when returning from settings
onActivated(() => {
  currentTheme.value = localStorage.getItem('messaging-theme') || 'default'
})

// Watch for new messages to auto-scroll
watch(messages, () => {
  nextTick(() => scrollerRef.value?.scrollToItem(messages.value.length - 1))
}, { deep: true })

function selectConversation(conversation: typeof currentConversation.value) {
  if (!currentUserId.value || !conversation)
    return
  conversationStore.selectConversation(conversation, currentUserId.value)
}

function backToConversations() {
  conversationStore.backToConversations()
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

onUnmounted(() => {
  conversationStore.cleanupRealtimeListener()
})

async function sendMessage() {
  if (!newMessage.value.trim() || !currentUserId.value)
    return

  const success = await conversationStore.sendMessage(newMessage.value, currentUserId.value)

  if (success) {
    newMessage.value = ''
    nextTick(() => inputRef.value?.focus())
  }
}

function goToSettings() {
  router.push('/messaging/settings')
}

function toggleTimestamp(messageId: string) {
  messageTimestampsVisible.value = {
    ...messageTimestampsVisible.value,
    [messageId]: !messageTimestampsVisible.value[messageId],
  }
}

function formatTimestamp(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MessageInput = defineAsyncComponent(() => import('../components/MessageInput.vue'))
const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))
</script>

<template>
  <div class="messaging-bg" :style="backgroundStyle">
    <div class="messaging-header">
      <template v-if="currentConversation">
        <button class="back-btn" @click="backToConversations">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
            <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
          </svg>
        </button>
        <div class="chat-info">
          <!-- <span class="chat-avatar">🐱</span> -->
          <span class="chat-title">{{ currentConversation.otherUserName }}</span>
        </div>
        <button class="menu-btn" disabled>
          ⋮
        </button>
      </template>
      <template v-else>
        <button class="back-btn" @click="router.back()">
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
      </template>
    </div>

    <div class="messaging-container">
      <!-- Loading State -->
      <div v-if="isLoading && !conversations.length" class="loading-state">
        <p>Loading...</p>
      </div>

      <!-- Empty State (No Conversations) -->
      <div v-else-if="!hasConversations && !currentConversation" class="empty-state">
        <div class="empty-state-content">
          <span class="empty-icon">💬</span>
          <h3>No conversations yet</h3>
          <p>Start chatting with friends!</p>
          <button class="create-btn" @click="showCreateModal = true">
            Start Conversation
          </button>
        </div>
      </div>

      <!-- Conversation List View -->
      <div v-else-if="!currentConversation" class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          @click="selectConversation(conv)"
        >
          <div class="conv-avatar">
            {{ conv.otherUserName.charAt(0).toUpperCase() }}
          </div>
          <div class="conv-details">
            <span class="conv-name">{{ conv.otherUserName }}</span>
            <span class="conv-preview">Tap to chat</span>
          </div>
        </div>
        <FloatingActionButton aria-label="Start new chat" @click="showCreateModal = true" />
      </div>

      <!-- Chat View -->
      <div v-else class="messages-list">
        <div v-for="group in groupedMessages" :key="group.date" class="message-group">
          <!-- Date Separator -->
          <div class="date-separator">
            <span class="date-separator-text">{{ group.date }}</span>
          </div>

          <!-- Messages in this date group -->
          <div
            v-for="(msg, idx) in group.messages"
            :key="msg.id"
            class="message-wrapper"
            :class="{
              'message-wrapper-self': msg.isSelf,
              'first-in-group': isFirstInGroup(group.messages, idx),
              'last-in-group': isLastInGroup(group.messages, idx),
            }"
          >
            <!-- Avatar for other user (only show on last message in group) -->
            <div
              v-if="!msg.isSelf && isLastInGroup(group.messages, idx)"
              class="message-avatar"
            >
              {{ currentConversation?.otherUserName?.charAt(0).toUpperCase() }}
            </div>
            <div v-else-if="!msg.isSelf" class="message-avatar-spacer" />

            <div
              class="message-bubble"
              :class="{
                'message-self': msg.isSelf,
                'message-other': !msg.isSelf,
                'bubble-first': isFirstInGroup(group.messages, idx),
                'bubble-last': isLastInGroup(group.messages, idx),
                'bubble-middle': !isFirstInGroup(group.messages, idx) && !isLastInGroup(group.messages, idx),
              }"
              @click="toggleTimestamp(msg.id)"
            >
              <p class="message-text">
                {{ msg.content }}
              </p>
              <span
                class="message-timestamp"
                :class="{ 'timestamp-visible': messageTimestampsVisible[msg.id] }"
              >
                {{ formatTimestamp(msg.createdAt) }}
                <span v-if="msg.isSelf" class="read-status">✓✓</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <MessageInput
      v-if="currentConversation"
      v-model="newMessage"
      :is-loading="isLoading"
      @send="sendMessage"
    />

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <AddModal
      :show-modal="showCreateModal"
      title="Start New Conversation"
      submit-button-text="Start Chat"
      @close="showCreateModal = false"
      @submit="createConversation"
    >
      <div class="input-group">
        <label for="userId">User ID</label>
        <input
          id="userId"
          v-model="newRecipientId"
          type="text"
          placeholder="Enter User ID to message..."
          required
        >
      </div>
    </AddModal>
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

.chat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.chat-avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #FF6FD8 0%, #3813C2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.4rem;
  box-shadow: 0 4px 12px rgba(56, 19, 194, 0.2);
  border: 2px solid #fff;
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

/* Empty State Styling */
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

/* Messages */
.no-conversation {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-style: italic;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1rem;
}

.message-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Date Separator */
.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  margin: 0.5rem 0;
}

.date-separator-text {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Message Wrapper */
.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  animation: messageSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0.125rem 0;
}

.message-wrapper-self {
  flex-direction: row-reverse;
}

.message-wrapper.first-in-group {
  margin-top: 0.75rem;
}

.message-wrapper.last-in-group {
  margin-bottom: 0.25rem;
}

/* Message Avatar */
.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
}

.message-avatar-spacer {
  width: 32px;
  flex-shrink: 0;
}

/* Message Bubble */
.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.message-bubble:active {
  transform: scale(0.98);
}

/* Other User Messages */
.message-other {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.message-other.bubble-first {
  border-radius: 20px 20px 20px 6px;
}

.message-other.bubble-middle {
  border-radius: 6px 20px 20px 6px;
}

.message-other.bubble-last {
  border-radius: 6px 20px 20px 20px;
}

.message-other.bubble-first.bubble-last {
  border-radius: 20px 20px 20px 6px;
}

/* Self Messages */
.message-self {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3), 0 2px 6px rgba(124, 58, 237, 0.2);
}

.message-self.bubble-first {
  border-radius: 20px 20px 6px 20px;
}

.message-self.bubble-middle {
  border-radius: 20px 6px 6px 20px;
}

.message-self.bubble-last {
  border-radius: 20px 6px 20px 20px;
}

.message-self.bubble-first.bubble-last {
  border-radius: 20px 20px 6px 20px;
}

/* Hover Effects */
.message-other:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.message-self:hover {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35), 0 4px 10px rgba(124, 58, 237, 0.25);
  transform: translateY(-1px);
}

/* Message Text */
.message-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Timestamp */
.message-timestamp {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  margin-top: 0.375rem;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.message-other .message-timestamp {
  color: #64748b;
}

.message-self .message-timestamp {
  color: rgba(255, 255, 255, 0.85);
  justify-content: flex-end;
}

.timestamp-visible {
  opacity: 1;
  max-height: 1.5rem;
}

/* Read Status */
.read-status {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 0.125rem;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modals & Inputs */
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

.error-message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5);
  animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translate(-50%, 40px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 480px) {
  .message-bubble {
    max-width: 85%;
  }

  .message-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .message-avatar-spacer {
    width: 28px;
  }

  .date-separator-text {
    font-size: 0.6875rem;
    padding: 0.375rem 0.875rem;
  }

  .empty-icon {
    font-size: 5rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
  }
}

/* Conversation List Styles */
.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 5rem; /* Space for FAB */
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
</style>
