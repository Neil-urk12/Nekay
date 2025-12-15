<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { supabase } from '../supabase/supabase-config'
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { useRouter } from 'vue-router';
import { defineAsyncComponent } from 'vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import type { RealtimeChannel } from '@supabase/supabase-js'

const router = useRouter();

let messageChannel: RealtimeChannel | null = null;

const encryptionKey: string = import.meta.env.VITE_ENCRYPTION_KEY;
if (!encryptionKey) {
  throw new Error('Missing VITE_ENCRYPTION_KEY in environment variables');
}

const encryptMessage = (message: string) => {
  return AES.encrypt(message, encryptionKey).toString();
};

const decryptMessage = (encryptedMessage: string) => {
  try {
    const bytes = AES.decrypt(encryptedMessage, encryptionKey);
    return bytes.toString(Utf8) || '';
  } catch (e) {
    console.error('Decryption error', e);
    return ''; // Handle decryption errors gracefully
  }
};

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
const inputRef = ref<HTMLInputElement|null>(null)

const otherUserDisplayName = computed(() => currentConversation.value?.otherUserName || 'Chat')

// Initialize messaging
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  currentUserId.value = session?.user?.id || null;
  
  if (!currentUserId.value) {
    router.push('/login');
    return;
  }

  // TODO: In a real app, get otherUserId from route params or conversation list
  // For now, we'll try to fetch the first conversation or wait for user to start one
  await loadConversations();
});

const loadConversations = async () => {
  if (!currentUserId.value) return;
  
  // Get user's conversations
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${currentUserId.value},user2_id.eq.${currentUserId.value}`);
  
  if (error) {
    console.error('Error loading conversations:', error);
    return;
  }
  
  if (conversations && conversations.length > 0) {
    // Load the first conversation for now
    const convo = conversations[0];
    const otherId = convo.user1_id === currentUserId.value ? convo.user2_id : convo.user1_id;
    
    currentConversation.value = {
      id: convo.id,
      user1Id: convo.user1_id,
      user2Id: convo.user2_id,
      otherUserName: 'Dudu', // TODO: Fetch actual user name
    };
    
    otherUserId.value = otherId;
    await loadMessages(convo.id);
    setupRealtimeListener(convo.id);
  }
};

const loadMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error);
    return;
  }

  messages.value = (data || []).map(msg => ({
    id: msg.id,
    content: decryptMessage(msg.content),
    createdAt: msg.created_at,
    isSelf: msg.sender_id === currentUserId.value,
    senderId: msg.sender_id,
    readBy: msg.read_by,
  }));

  nextTick(() => scrollerRef.value?.scrollToItem(messages.value.length - 1));
};

const setupRealtimeListener = (conversationId: string) => {
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
        const msg = payload.new as any;
        
        const newMsg: Message = {
          id: msg.id,
          content: decryptMessage(msg.content),
          createdAt: msg.created_at,
          isSelf: msg.sender_id === currentUserId.value,
          senderId: msg.sender_id,
          readBy: msg.read_by,
        };
        
        // Avoid duplicates
        if (!messages.value.find(m => m.id === newMsg.id)) {
          messages.value.push(newMsg);
          nextTick(() => scrollerRef.value?.scrollToItem(messages.value.length - 1));
        }
      }
    )
    .subscribe();
};

onUnmounted(() => {
  if (messageChannel) {
    supabase.removeChannel(messageChannel);
  }
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  if (!currentUserId.value || !currentConversation.value) {
    error.value = 'No active conversation';
    return;
  }
  
  isLoading.value = true;
  error.value = null;

  try {
    const encryptedContent = encryptMessage(newMessage.value);
    
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: currentConversation.value.id,
      sender_id: currentUserId.value,
      content: encryptedContent,
    });
    
    if (insertError) throw insertError;
    
    newMessage.value = '';
    nextTick(() => inputRef.value?.focus())
  } catch (e) {
    error.value = 'Failed to send message';
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

const toggleTimestamp = (messageId: string) => {
  messageTimestampsVisible.value = {
    ...messageTimestampsVisible.value,
    [messageId]: !messageTimestampsVisible.value[messageId]
  }
}

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <span class="chat-avatar">🐱</span>
        <span class="chat-title">{{ otherUserDisplayName }}</span>
      </div>
      <button class="menu-btn" disabled>⋮</button>
    </div>
    
    <div class="messaging-container">
      <div v-if="!currentConversation" class="no-conversation">
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
      :isLoading="isLoading"
      @send="sendMessage"
    />
    
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped>
.messaging-bg {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(to bottom, #f8f4ff, #f0e8ff);
}

.messaging-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #8a4fff;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: relative;
  z-index: 10;
}

.back-btn, .menu-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.back-btn:hover, .menu-btn:hover {
  transform: scale(1.1);
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-avatar {
  width: 36px;
  height: 36px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.messaging-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(255,255,255,0.7);
  scroll-behavior: smooth;
}

.no-conversation {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1rem;
}

.message {
  max-width: 80%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-self {
  align-self: flex-end;
}

.message-content {
  background: #fff;
  padding: 0.75rem 1rem;
  border-radius: 1.25rem;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  word-break: break-word;
  width: fit-content;
  cursor: pointer;
}

.message-self .message-content {
  background: #8a4fff;
  color: #fff;
}

.message-timestamp {
  display: block;
  font-size: 0.7rem;
  color: #666;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s;
  margin-top: 0;
}

.message-self .message-timestamp {
  color: rgba(255,255,255,0.7);
}

.timestamp-visible {
  opacity: 1;
  max-height: 1.5rem;
  margin-top: 0.25rem;
}

.error-message {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4f4f;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  animation: slideIn 0.3s ease-out;
  z-index: 100;
}

@keyframes slideIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
  }
}
</style>
