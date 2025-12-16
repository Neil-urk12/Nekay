<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'
import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddModal from '../components/AddModal.vue'
import { supabase } from '../supabase/supabase-config'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const router = useRouter()

let messageChannel: RealtimeChannel | null = null

const encryptionKey: string = import.meta.env.VITE_ENCRYPTION_KEY
if (!encryptionKey) {
  throw new Error('Missing VITE_ENCRYPTION_KEY in environment variables')
}

function encryptMessage(message: string) {
  return AES.encrypt(message, encryptionKey).toString()
}

function decryptMessage(encryptedMessage: string) {
  try {
    const bytes = AES.decrypt(encryptedMessage, encryptionKey)
    return bytes.toString(Utf8) || ''
  }
  catch (e) {
    console.error('Decryption error', e)
    return '' // Handle decryption errors gracefully
  }
}

interface Message {
  id: string
  content: string
  createdAt: string
  isSelf: boolean
  senderId: string
  readBy: string[] | null
}

interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  otherUserName: string
}

const messages = ref<Message[]>([])
const newMessage = ref('')
const messageTimestampsVisible = ref<{ [key: string]: boolean }>({})
const currentConversation = ref<Conversation | null>(null)
const currentUserId = ref<string | null>(null)

// TODO: This is hardcoded for now - in a real app you'd get this from route params or user selection
const otherUserId = ref<string | null>(null)

// refs for auto-scroll and input focus
const scrollerRef = ref<any>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const showCreateModal = ref(false)
const newRecipientId = ref('')
const hasConversations = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Initialize messaging
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUserId.value = session?.user?.id || null

  if (!currentUserId.value) {
    router.push('/login')
    return
  }

  await loadConversations()
})

async function loadConversations() {
  if (!currentUserId.value)
    return

  // Get user's conversations
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${currentUserId.value},user2_id.eq.${currentUserId.value}`)

  if (error) {
    console.error('Error loading conversations:', error)
    return
  }

  hasConversations.value = !!conversations && conversations.length > 0

  if (hasConversations.value) {
    // Load the first conversation for now
    const convo = conversations[0]
    const otherId = convo.user1_id === currentUserId.value ? convo.user2_id : convo.user1_id

    currentConversation.value = {
      id: convo.id,
      user1Id: convo.user1_id,
      user2Id: convo.user2_id,
      otherUserName: 'Dudu', // TODO: Fetch actual user name
    }

    otherUserId.value = otherId
    await loadMessages(convo.id)
    setupRealtimeListener(convo.id)
  }
}

async function createConversation() {
  if (!newRecipientId.value.trim()) {
    error.value = 'Please enter a User ID'
    return
  }

  try {
    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', newRecipientId.value.trim())
      .single()

    if (userError || !user) {
      error.value = 'User not found. Please check the ID.'
      return
    }

    // 2. Check if conversation already exists (optional but good)
    // For now, allow DB to handle unique constraint or just insert

    const { error: insertError } = await supabase.from('conversations').insert({
      user1_id: currentUserId.value,
      user2_id: user.id,
    }).select().single()

    if (insertError)
      throw insertError

    showCreateModal.value = false
    newRecipientId.value = ''

    // Reload to show the new conversation
    await loadConversations()
  }
  catch (err) {
    console.error('Error creating conversation', err)
    error.value = 'Failed to create conversation.'
  }
}

async function loadMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading messages:', error)
    return
  }

  messages.value = (data || []).map(msg => ({
    id: msg.id,
    content: decryptMessage(msg.content),
    createdAt: msg.created_at,
    isSelf: msg.sender_id === currentUserId.value,
    senderId: msg.sender_id,
    readBy: msg.read_by,
  }))

  nextTick(() => scrollerRef.value?.scrollToItem(messages.value.length - 1))
}

function setupRealtimeListener(conversationId: string) {
  messageChannel = supabase
    .channel(`messages_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as any

        const newMsg: Message = {
          id: msg.id,
          content: decryptMessage(msg.content),
          createdAt: msg.created_at,
          isSelf: msg.sender_id === currentUserId.value,
          senderId: msg.sender_id,
          readBy: msg.read_by,
        }

        // Avoid duplicates
        if (!messages.value.find(m => m.id === newMsg.id)) {
          messages.value.push(newMsg)
          nextTick(() => scrollerRef.value?.scrollToItem(messages.value.length - 1))
        }
      },
    )
    .subscribe()
}

onUnmounted(() => {
  if (messageChannel) {
    supabase.removeChannel(messageChannel)
  }
})

async function sendMessage() {
  if (!newMessage.value.trim())
    return
  if (!currentUserId.value || !currentConversation.value) {
    error.value = 'No active conversation'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const encryptedContent = encryptMessage(newMessage.value)

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: currentConversation.value.id,
      sender_id: currentUserId.value,
      content: encryptedContent,
    })

    if (insertError)
      throw insertError

    newMessage.value = ''
    nextTick(() => inputRef.value?.focus())
  }
  catch (e) {
    error.value = 'Failed to send message'
    console.error(e)
  }
  finally {
    isLoading.value = false
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
  <div class="messaging-bg">
    <div class="messaging-header">
      <button class="back-btn" @click="router.back()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          width="1rem"
        >
          <path
            fill="currentColor"
            d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
          />
        </svg>
      </button>
      <div class="chat-info">
        <!-- <span class="chat-avatar">🐱</span> -->
        <span class="chat-title">Cutiegram chats</span>
      </div>
      <button class="menu-btn" disabled>
        ⋮
      </button>
    </div>

    <div class="messaging-container">
      <div v-if="!hasConversations && !isLoading" class="empty-state">
        <div class="empty-state-content">
          <span class="empty-icon">💬</span>
          <h3>No conversations yet</h3>
          <p>Start chatting with friends!</p>
          <button class="create-btn" @click="showCreateModal = true">
            Start Conversation
          </button>
        </div>
      </div>
      <div v-else-if="!currentConversation" class="no-conversation">
        <p>No conversation selected</p>
      </div>
      <div v-else class="messages-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message"
          :class="{ 'message-self': msg.isSelf }"
          @click="toggleTimestamp(msg.id)"
        >
          <div class="message-content">
            {{ msg.content }}
            <span
              class="message-timestamp"
              :class="{ 'timestamp-visible': messageTimestampsVisible[msg.id] }"
            >
              {{ formatTimestamp(msg.createdAt) }}
            </span>
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
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  font-family: 'Inter', sans-serif;
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
  gap: 1rem;
  padding-bottom: 1rem;
}

.message {
  max-width: 75%;
  animation: messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.message-self {
  align-self: flex-end;
}

.message-content {
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  color: #2d3748;
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  width: fit-content;
}

.message:hover .message-content {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.message-self .message-content {
  background: linear-gradient(135deg, #8a4fff 0%, #6e3aff 100%);
  color: white;
  border-radius: 18px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 18px;
  box-shadow: 0 4px 15px rgba(138, 79, 255, 0.25);
}

.message-timestamp {
  display: block;
  font-size: 0.75rem;
  margin-top: 0.4rem;
  opacity: 0.7;
  font-weight: 500;
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
  .message {
    max-width: 85%;
  }

  .empty-icon {
    font-size: 5rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
  }
}
</style>
