<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { auth, rdb } from '../firebase/firebase-config'
import { useAuthStore } from '../stores/authStore'
import {
  ref as dbRef,
  push,
  onValue,
  query,
  orderByChild
} from 'firebase/database'
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { useRouter } from 'vue-router';
import { defineAsyncComponent } from 'vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const router = useRouter();
const authStore = useAuthStore();

let messageListener: any = null;

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
  timestamp: number
  isSelf: boolean
  senderId: string
  senderNickname: string
  receiverNickname: string
}

const messages = ref<Message[]>([])
const newMessage = ref('')
const messageTimestampsVisible = ref<{ [key: string]: boolean }>({})
// const conversationData = ref({
//   receiverNickname: 'dudu0618051823'
// })

// Use the imported rdb instance
const messagesRef = dbRef(rdb, 'messages')

// refs for auto-scroll and input focus
const scrollerRef = ref<any>(null)
const inputRef = ref<HTMLInputElement|null>(null)

// Subscribe to messages
onMounted(() => {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    router.push('/login');
    return;
  }

  const currentNickname = 'bubu1112041823';
  const otherNickname = 'dudu0618051823';
  setupMessageListener(currentUserId, currentNickname, otherNickname);
});

const setupMessageListener = (currentUserId: string, currentNickname: string, otherNickname: string) => {
  const messagesQuery = query(
    messagesRef,
    orderByChild('timestamp')
  );

  messageListener = onValue(messagesQuery, (snapshot) => {
    const newMessages: Message[] = []
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (isRelevantMessage(data, currentUserId, currentNickname, otherNickname)) {
        newMessages.push(createMessageObject(data, childSnapshot.key, currentUserId));
      }
    });
    messages.value = newMessages;
    nextTick(() => scrollerRef.value?.scrollToItem(newMessages.length - 1));
  });
};

const isRelevantMessage = (data: any, currentUserId: string, currentNickname: string, otherNickname: string) => {
  return (
    (data.senderId === currentUserId && data.receiverNickname === otherNickname) ||
    (data.senderNickname === currentNickname && data.receiverNickname === otherNickname) ||
    (data.senderNickname === otherNickname && data.receiverNickname === currentNickname)
  );
};

const createMessageObject = (data: any, key: string | null, currentUserId: string): Message => {
  const decryptedContent = decryptMessage(data.content);
  return {
    id: key || '',
    content: decryptedContent,
    timestamp: data.timestamp,
    isSelf: data.senderId === currentUserId,
    senderId: data.senderId,
    senderNickname: data.senderNickname,
    receiverNickname: data.receiverNickname
  };
};

onUnmounted(() => {
  if (messageListener) {
    messageListener();
  }
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  const senderNickname = 'bubu1112041823';
  const receiverNickname = 'dudu0618051823'

  const currentUserId = authStore.getCurrentUserId;
  if (!currentUserId) {
    router.push('/login');
    return;
  }
  isLoading.value = true;
  error.value = null;

  try {
    const encryptedContent = encryptMessage(newMessage.value);
    const message: Message = {
      id: Date.now().toString(),
      content: encryptedContent,
      timestamp: new Date().getTime(),
      isSelf: true,
      senderId: currentUserId,
      senderNickname: senderNickname,
      receiverNickname: receiverNickname
    }
    await push(messagesRef, message);
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

// const showMenu and toggleMenu disabled
// const showMenu = ref(false)
// const toggleMenu = () => { showMenu.value = !showMenu.value }
// const goProfile = (nickname: string) => { router.push(`/profile/${nickname}`) }
// const poke = () => { console.log('poke!') }

const MessagesList = defineAsyncComponent(() => import('../components/MessagesList.vue'))
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
        <span class="chat-title">Dudu</span>
      </div>
      <!-- Dropdown disabled -->
      <button class="menu-btn" disabled>⋮</button>
      <!-- menu-dropdown disabled -->
      <!-- <div v-if="showMenu" class="menu-dropdown">
        <button @click="goProfile('dudu0618051823')">Go to Dudu's profile</button>
        <button @click="goProfile('bubu1112041823')">Go to my profile</button>
        <button @click="poke">poke</button>
      </div> -->
    </div>
    <div class="messaging-container">
      <MessagesList
        :messages="messages"
        :messageTimestampsVisible="messageTimestampsVisible"
        @toggle="toggleTimestamp"
      />
    </div>
    <MessageInput
      v-model="newMessage"
      :isLoading="isLoading"
      @send="sendMessage"
    />
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
  padding: 0.25rem;
  background: #8a4fff;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: relative;
  z-index: 10;
}

.input-action-btn {
  background: transparent;
  padding: 0 0.25rem;
  border: none;
  cursor: pointer;
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

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
}

.message-self .message-content {
  background: #8a4fff;
  color: #fff;
}

.message-timestamp {
  position: absolute;
  bottom: -1.5rem;
  right: 0;
  font-size: 0.7rem;
  color: #666;
  opacity: 0;
  transition: all 0.3s;
  background: rgba(255,255,255,0.9);
  padding: 0.2rem 0.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-self .message-timestamp {
  right: auto;
  left: 0;
}

.timestamp-visible {
  opacity: 1;
  transform: translateY(-2px);
}

.message-input {
  display: flex;
  padding: 0.75rem 1rem;
  background: #fff;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #eee;
}

.message-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 1.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.message-input input:focus {
  outline: none;
  border-color: #8a4fff;
}

.send-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
}

.send-btn:hover {
  background: #7b3aff;
  transform: scale(1.05);
}

.send-btn:active {
  transform: scale(0.98);
}

.send-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0.75rem;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 0.5rem;
  padding: 0.25rem 0;
  z-index: 20;
}

.menu-dropdown button {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.menu-dropdown button:hover {
  background: #f0f0f0;
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
  }
  
  .message-input {
    padding: 0.75rem 0.5rem;
  }
  
  .send-btn {
    padding: 0.5rem 1rem;
  }
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

.message-status {
  position: absolute;
  right: -1.5rem;
  bottom: 0;
  font-size: 0.7rem;
  color: #8a4fff;
}

.message-self .message-status {
  right: auto;
  left: -1.5rem;
  color: #fff;
}
</style>
