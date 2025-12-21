<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useConversationStore } from '../stores/conversationStore'
import { useTypingStore } from '../stores/typingStore'

const UserAvatar = defineAsyncComponent(() => import('../components/UserAvatar.vue'))
const TypingIndicatorText = defineAsyncComponent(() => import('../components/TypingIndicatorText.vue'))

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const typingStore = useTypingStore()

const { currentConversation, messages, isLoading, error } = storeToRefs(conversationStore)
const { isOtherUserTyping, otherUserName: typingUserName } = storeToRefs(typingStore)
const { getCurrentUserId } = storeToRefs(authStore)

const newMessage = ref('')
const messageTimestampsVisible = ref<{ [key: string]: boolean }>({})
const inputRef = ref<HTMLInputElement | null>(null)
const messagesContainerRef = ref<HTMLElement | null>(null)
const showNewMessageToast = ref(false)
const isInitialLoad = ref(true)

function isNearBottom() {
  if (!messagesContainerRef.value)
    return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.value
  return scrollHeight - scrollTop - clientHeight < 100
}

function scrollToBottom() {
  nextTick(() => {
    messagesContainerRef.value?.scrollTo({
      top: messagesContainerRef.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

function handleNewMessageToastClick() {
  showNewMessageToast.value = false
  scrollToBottom()
}

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

const activeBackground = computed(() => {
  if (currentConversation.value?.backgroundUrl) {
    return {
      backgroundImage: `url(${currentConversation.value.backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }
  }
  return backgroundStyle.value
})

const currentUserId = computed(() => getCurrentUserId.value)

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

onMounted(async () => {
  await authStore.setUser()

  if (!currentUserId.value) {
    router.push('/login')
    return
  }

  const conversationId = route.params.id as string
  if (conversationId) {
    await conversationStore.loadConversations(currentUserId.value)
    const conv = conversationStore.conversations.find(c => c.id === conversationId)
    if (conv) {
      conversationStore.selectConversation(conv, currentUserId.value)
      // Setup typing indicator listener
      typingStore.setupTypingListener(conversationId, currentUserId.value, conv.otherUserName)
    }
    else {
      router.push('/messaging')
    }
  }
})

onActivated(() => {
  currentTheme.value = localStorage.getItem('messaging-theme') || 'default'
})

watch(messages, () => {
  if (isInitialLoad.value) {
    isInitialLoad.value = false
    scrollToBottom()
  }
  else if (isNearBottom()) {
    scrollToBottom()
  }
  else {
    showNewMessageToast.value = true
  }
}, { deep: true })

onUnmounted(() => {
  conversationStore.backToConversations()
  typingStore.cleanupTypingListener()
})

// Typing event handlers
function handleTyping() {
  typingStore.broadcastTyping(true)
}

function handleStopTyping() {
  typingStore.broadcastTyping(false)
}

function backToConversations() {
  router.push('/messaging')
}

async function sendMessage() {
  if (!newMessage.value.trim() || !currentUserId.value)
    return

  const success = await conversationStore.sendMessage(newMessage.value, currentUserId.value)

  if (success) {
    newMessage.value = ''
    nextTick(() => inputRef.value?.focus())
  }
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
</script>

<template>
  <div class="messaging-bg" :style="activeBackground">
    <div class="messaging-header">
      <button class="back-btn" @click="backToConversations">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <div class="chat-info">
        <span class="chat-title">{{ currentConversation?.otherUserName }}</span>
        <span v-if="isOtherUserTyping" class="chat-subtitle">typing...</span>
      </div>
      <button
        class="menu-btn"
        @click="conversationStore.currentConversation && router.push(`/messaging/${conversationStore.currentConversation.id}/settings`)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" width="0.5rem">
          <path fill="currentColor" d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z" />
        </svg>
      </button>
    </div>

    <div ref="messagesContainerRef" class="messaging-container">
      <div class="messages-list">
        <div v-for="group in groupedMessages" :key="group.date" class="message-group">
          <div class="date-separator">
            <span class="date-separator-text">{{ group.date }}</span>
          </div>

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
            <UserAvatar
              v-if="!msg.isSelf && isLastInGroup(group.messages, idx)"
              :avatar-url="currentConversation?.otherUserAvatarUrl"
              :name="currentConversation?.otherUserName"
              :size="32"
              class="message-avatar-img"
            />
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

    <!-- Typing indicator (text) -->
    <Transition name="fade-typing">
      <TypingIndicatorText v-if="isOtherUserTyping" :name="typingUserName" />
    </Transition>

    <!-- New message toast -->
    <Transition name="fade-typing">
      <button v-if="showNewMessageToast" class="new-message-toast" @click="handleNewMessageToastClick">
        ↓ New message
      </button>
    </Transition>

    <MessageInput
      v-model="newMessage"
      :is-loading="isLoading"
      @send="sendMessage"
      @typing="handleTyping"
      @stop-typing="handleStopTyping"
    />

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
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
  gap: 0.125rem;
}

.chat-subtitle {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
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

.message-other:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.message-self:hover {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35), 0 4px 10px rgba(124, 58, 237, 0.25);
  transform: translateY(-1px);
}

.message-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

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

.fade-typing-enter-active,
.fade-typing-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-typing-enter-from,
.fade-typing-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.new-message-toast {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  z-index: 50;
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
}
</style>
