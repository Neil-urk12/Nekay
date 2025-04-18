<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { auth, rdb } from '../firebase/firebase-config'
import { useAuthStore } from '../stores/authStore'
import {
  ref as dbRef,
  push,
  onValue,
  query,
  orderByChild
} from 'firebase/database'
import * as CryptoJS from 'crypto-js';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

let messageListener: any = null;

const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

const encryptMessage = (message: string) => {
  return CryptoJS.AES.encrypt(message, encryptionKey).toString();
};

const decryptMessage = (encryptedMessage: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
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
const conversationData = ref({
  receiverNickname: 'dudu0618051823'
})

// Use the imported rdb instance
const messagesRef = dbRef(rdb, 'messages')

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

  const currentUserId : string | null = authStore.getCurrentUserId
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
        <span class="chat-title">{{ conversationData.receiverNickname }}</span>
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
      <div class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', { 'message-self': message.isSelf }]"
        >
          <div class="message-content" @click="toggleTimestamp(message.id)">
            {{ message.content }}
            <div
              class="message-timestamp"
              :class="{ 'timestamp-visible': messageTimestampsVisible[message.id] }"
            >
              {{
                new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }}
            </div>
            <div class="message-status" v-if="message.isSelf">
              ✓✓
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="message-input">
      <button class="input-action-btn">
        <span class="emoji-icon">
          <svg width="1.5rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"/>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
            <g id="SVGRepo_iconCarrier"> <path d="M8.9126 15.9336C10.1709 16.249 11.5985 16.2492 13.0351 15.8642C14.4717 15.4793 15.7079 14.7653 16.64 13.863" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/> <ellipse cx="14.5094" cy="9.77405" rx="1" ry="1.5" transform="rotate(-15 14.5094 9.77405)" fill="#1C274C"/> <ellipse cx="8.71402" cy="11.3278" rx="1" ry="1.5" transform="rotate(-15 8.71402 11.3278)" fill="#1C274C"/> <path d="M13 16.0004L13.478 16.9742C13.8393 17.7104 14.7249 18.0198 15.4661 17.6689C16.2223 17.311 16.5394 16.4035 16.1708 15.6524L15.7115 14.7168" stroke="#1C274C" stroke-width="1.5"/> <path d="M4.92847 4.92663C6.12901 3.72408 7.65248 2.81172 9.41185 2.34029C14.7465 0.910876 20.2299 4.0767 21.6593 9.41136C23.0887 14.746 19.9229 20.2294 14.5882 21.6588C9.25357 23.0882 3.7702 19.9224 2.34078 14.5877C1.86936 12.8284 1.89775 11.0528 2.33892 9.41186" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/> </g>
          </svg>
        </span>
      </button>
      <!-- <button class="input-action-btn">
        <span class="attach-icon">📎</span>
      </button> -->
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        @keyup.enter="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="isLoading">
        <svg class="send-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" stroke-width="0" />
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" />
          <g id="SVGRepo_iconCarrier">
            <path
              d="M17.4348 9.30862L8.11093 4.32915C5.86721 3.13088 3.37713 5.40233 4.14065 7.95083L5.35853 12.0159L4.14654 16.046C3.38055 18.593 5.86709 20.8673 8.112 19.6729L17.431 14.715C19.5212 13.6029 19.5235 10.4241 17.4348 9.30862Z"
              fill="#dc8add"
              fill-opacity="0.15"
            />
            <path
              d="M8.11093 4.32915L8.46424 3.66758L8.11093 4.32915ZM17.4348 9.30862L17.0815 9.97019L17.4348 9.30862ZM17.431 14.715L17.7832 15.3771L17.431 14.715ZM8.112 19.6729L7.75973 19.0108H7.75973L8.112 19.6729ZM4.14654 16.046L3.42831 15.83L4.14654 16.046ZM4.14065 7.95083L3.4222 8.16607L4.14065 7.95083ZM8.32953 12.7659C8.74375 12.7659 9.07953 12.4302 9.07953 12.0159C9.07953 11.6017 8.74375 11.2659 8.32953 11.2659V12.7659ZM7.75761 4.99071L17.0815 9.97019L17.7881 8.64706L8.46424 3.66758L7.75761 4.99071ZM17.0787 14.0529L7.75973 19.0108L8.46426 20.3351L17.7832 15.3771L17.0787 14.0529ZM4.86476 16.262L6.07675 12.2319L4.64031 11.7999L3.42831 15.83L4.86476 16.262ZM6.07698 11.8007L4.8591 7.73559L3.4222 8.16607L4.64008 12.2312L6.07698 11.8007ZM5.35853 12.7659H8.32953V11.2659H5.35853V12.7659ZM7.75973 19.0108C6.95053 19.4413 6.10735 19.2587 5.50636 18.7091C4.90044 18.1549 4.56934 17.2443 4.86476 16.262L3.42831 15.83C2.95775 17.3947 3.48692 18.8948 4.494 19.8159C5.50601 20.7415 7.02855 21.0989 8.46426 20.3351L7.75973 19.0108ZM17.0815 9.97019C18.6409 10.803 18.639 13.2228 17.0787 14.0529L17.7832 15.3771C20.4035 13.9831 20.4061 10.0452 17.7881 8.64706L17.0815 9.97019ZM8.46424 3.66758C7.02937 2.90128 5.50602 3.25644 4.49263 4.18085C3.48418 5.10076 2.95316 6.60051 3.4222 8.16607L4.8591 7.73559C4.56462 6.75266 4.89688 5.84243 5.50352 5.28905C6.10522 4.74018 6.94877 4.55875 7.75761 4.99071L8.46424 3.66758Z"
              fill="#dc8add"
            />
          </g>
        </svg>
      </button>
    </div>
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
