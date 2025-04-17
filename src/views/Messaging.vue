<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { rdb } from '../firebase/firebase-config'
import { useAuthStore } from '../stores/authStore'
import {
  ref as dbRef,
  push,
  onValue,
  query,
  orderByChild
} from 'firebase/database'
import CryptoJS from 'crypto-js';
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

// Use the imported rdb instance
const messagesRef = dbRef(rdb, 'messages')

// Subscribe to messages
onMounted(() => {
  const currentUserId = authStore.getCurrentUserId
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
</script>

<template>
  <div class="messaging-container">
    <div class="messages-list">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', { 'message-self': message.isSelf }]"
      >
        <div
          class="message-content"
          @click="toggleTimestamp(message.id)"
        >
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
        </div>
      </div>
    </div>

    <div class="message-input">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        @keyup.enter="sendMessage"
        
      >
      <button @click="sendMessage">
        <svg
          width="2rem"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
.messaging-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #f5f5f5;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: calc(6rem + 1px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  max-width: 70%;
}

.message-self {
  margin-left: auto;
}

.message-content {
  background-color: white;
  padding: 0.75rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.message-self .message-content {
  background-color: #0084ff;
  color: white;
}

.message-timestamp {
  font-size: 0.7rem;
  opacity: 0;
  margin-top: 0;
  text-align: right;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.timestamp-visible {
  opacity: 1;
  margin-top: 0.25rem;
  max-height: 20px;
}

.message-self .message-timestamp {
  color: rgba(255, 255, 255, 0.7);
}

.message-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border-top: 1px solid #eee;
  position: fixed;
  bottom: calc(4rem + 1px); /* Height of bottom nav */
  width: 100%;
  max-width: 800px;
  left: 0;
  right: 0;
  margin: 0 auto;
}

.message-input input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 1.5rem;
  outline: none;
  font-size: 1rem;
}

.message-input button {
  padding: 0.75rem 1.5rem;
  background: none;
  color: white;
  border: none;
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 0rem;
}

.message-input button:hover {
  background-color: #0073e6;
}
</style>
