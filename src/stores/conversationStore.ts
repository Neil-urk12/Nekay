import type { RealtimeChannel } from '@supabase/supabase-js'
import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import { defineStore } from 'pinia'
import { supabase } from '../supabase/supabase-config'
import { compressImage } from '../utils/imageCompression'

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
    return ''
  }
}

export interface Message {
  id: string
  content: string
  createdAt: string
  isSelf: boolean
  senderId: string
  readBy: string[] | null
}

export interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  otherUserName: string
  otherUserAvatarUrl: string | null
  backgroundUrl: string | null
}

interface ConversationState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  conversationsLoaded: boolean
  messageChannel: RealtimeChannel | null
}

export const useConversationStore = defineStore('conversation', {
  state: (): ConversationState => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    error: null,
    conversationsLoaded: false,
    messageChannel: null,
  }),

  getters: {
    hasConversations: state => state.conversations.length > 0,
    getCurrentUserId: () => {
      // Will be set after auth check
      return null as string | null
    },
  },

  actions: {
    async loadConversations(currentUserId: string, forceRefresh = false) {
      // Skip fetch if already loaded and not forcing refresh
      if (this.conversationsLoaded && !forceRefresh) {
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)

        if (error) {
          throw error
        }

        if (conversations) {
          // Fetch user names for the other users in each conversation
          const otherUserIds = conversations.map(c =>
            c.user1_id === currentUserId ? c.user2_id : c.user1_id,
          )

          // Fetch names for all other users in one query
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', otherUserIds)

          // Create a map of userId -> user data for quick lookup
          const userDataMap = new Map<string, { name: string | null, avatarUrl: string | null }>()
          if (usersData) {
            usersData.forEach((user) => {
              userDataMap.set(user.id, {
                name: user.name,
                avatarUrl: user.avatar_url,
              })
            })
          }

          this.conversations = conversations.map((c) => {
            const otherUserId = c.user1_id === currentUserId ? c.user2_id : c.user1_id
            const otherUserData = userDataMap.get(otherUserId)
            const otherUserName = otherUserData?.name || `User ${otherUserId.slice(0, 4)}`
            const otherUserAvatarUrl = otherUserData?.avatarUrl || null

            return {
              id: c.id,
              user1Id: c.user1_id,
              user2Id: c.user2_id,
              otherUserName,
              otherUserAvatarUrl,
              backgroundUrl: c.background_url,
            }
          })
        }

        this.conversationsLoaded = true
      }
      catch (err) {
        console.error('Error loading conversations:', err)
        this.error = 'Failed to load conversations'
      }
      finally {
        this.isLoading = false
      }
    },

    async loadMessages(conversationId: string, currentUserId: string) {
      this.isLoading = true
      this.error = null

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        this.messages = (data || []).map(msg => ({
          id: msg.id,
          content: decryptMessage(msg.content),
          createdAt: msg.created_at,
          isSelf: msg.sender_id === currentUserId,
          senderId: msg.sender_id,
          readBy: msg.read_by,
        }))
      }
      catch (err) {
        console.error('Error loading messages:', err)
        this.error = 'Failed to load messages'
      }
      finally {
        this.isLoading = false
      }
    },

    setupRealtimeListener(conversationId: string, currentUserId: string) {
      // Clean up existing channel first
      this.cleanupRealtimeListener()

      this.messageChannel = supabase
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
              isSelf: msg.sender_id === currentUserId,
              senderId: msg.sender_id,
              readBy: msg.read_by,
            }

            // Avoid duplicates
            if (!this.messages.find(m => m.id === newMsg.id)) {
              this.messages.push(newMsg)
            }
          },
        )
        .subscribe()
    },

    cleanupRealtimeListener() {
      if (this.messageChannel) {
        supabase.removeChannel(this.messageChannel as RealtimeChannel)
        this.messageChannel = null
      }
    },

    selectConversation(conversation: Conversation, currentUserId: string) {
      this.currentConversation = conversation
      this.loadMessages(conversation.id, currentUserId)
      this.setupRealtimeListener(conversation.id, currentUserId)
    },

    backToConversations() {
      this.currentConversation = null
      this.messages = []
      this.cleanupRealtimeListener()
    },

    async createConversation(currentUserId: string, recipientId: string) {
      if (!recipientId.trim()) {
        this.error = 'Please enter a User ID'
        return false
      }

      this.isLoading = true
      this.error = null

      try {
        // Check if user exists
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', recipientId.trim())
          .maybeSingle()

        if (userError || !user) {
          this.error = 'User not found. Please check the ID.'
          return false
        }

        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            user1_id: currentUserId,
            user2_id: user.id,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        // Reload conversations to show the new one
        await this.loadConversations(currentUserId, true)
        return true
      }
      catch (err) {
        console.error('Error creating conversation', err)
        this.error = 'Failed to create conversation.'
        return false
      }
      finally {
        this.isLoading = false
      }
    },

    async sendMessage(content: string, currentUserId: string) {
      if (!content.trim() || !this.currentConversation) {
        this.error = 'No active conversation'
        return false
      }

      this.isLoading = true
      this.error = null

      try {
        const encryptedContent = encryptMessage(content)

        const { error: insertError } = await supabase.from('messages').insert({
          conversation_id: this.currentConversation.id,
          sender_id: currentUserId,
          content: encryptedContent,
        })

        if (insertError) {
          throw insertError
        }

        return true
      }
      catch (e) {
        this.error = 'Failed to send message'
        console.error(e)
        return false
      }
      finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },

    // Reset store state (useful for logout)
    $reset() {
      this.cleanupRealtimeListener()
      this.conversations = []
      this.currentConversation = null
      this.messages = []
      this.isLoading = false
      this.error = null
      this.conversationsLoaded = false
    },
    async uploadConversationBackground(file: File, conversationId: string) {
      this.isLoading = true
      this.error = null

      try {
        // Validate conversation membership before uploading
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error('You must be logged in to change the conversation background.')
        }

        const currentUserId = session.user.id

        // Check if user is a participant in this conversation
        const { data: conversation, error: fetchError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .maybeSingle()

        if (fetchError) {
          throw new Error('Failed to verify conversation membership.')
        }

        if (!conversation) {
          throw new Error('Conversation not found.')
        }

        if (conversation.user1_id !== currentUserId && conversation.user2_id !== currentUserId) {
          throw new Error('You are not a participant in this conversation.')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${conversationId}/${fileName}`

        // Compress the image before upload
        const compressedFile = await compressImage(file)

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('conversation-background')
          .upload(filePath, compressedFile)

        if (uploadError)
          throw uploadError

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('conversation-background')
          .getPublicUrl(filePath)

        // 3. Update Conversation Record
        const { data: updateData, error: updateError } = await supabase
          .from('conversations')
          .update({ background_url: publicUrl })
          .eq('id', conversationId)
          .select()

        if (updateError)
          throw updateError

        if (!updateData || updateData.length === 0) {
          throw new Error('Failed to update conversation. Check RLS policies.')
        }

        // 4. Update Local State
        const conv = this.conversations.find(c => c.id === conversationId)
        if (conv) {
          conv.backgroundUrl = publicUrl
        }
        if (this.currentConversation?.id === conversationId) {
          this.currentConversation.backgroundUrl = publicUrl
        }

        return true
      }
      catch (error) {
        console.error('Error uploading background:', error)
        this.error = 'Failed to upload background'
        return false
      }
      finally {
        this.isLoading = false
      }
    },

    async removeConversationBackground(conversationId: string) {
      this.isLoading = true
      this.error = null

      try {
        // Validate conversation membership before removing background
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error('You must be logged in to remove the conversation background.')
        }

        const currentUserId = session.user.id

        // Check if user is a participant in this conversation
        const { data: conversation, error: fetchError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .maybeSingle()

        if (fetchError) {
          throw new Error('Failed to verify conversation membership.')
        }

        if (!conversation) {
          throw new Error('Conversation not found.')
        }

        if (conversation.user1_id !== currentUserId && conversation.user2_id !== currentUserId) {
          throw new Error('You are not a participant in this conversation.')
        }

        const { error } = await supabase
          .from('conversations')
          .update({ background_url: null })
          .eq('id', conversationId)

        if (error)
          throw error

        const conv = this.conversations.find(c => c.id === conversationId)
        if (conv) {
          conv.backgroundUrl = null
        }
        if (this.currentConversation?.id === conversationId) {
          this.currentConversation.backgroundUrl = null
        }

        return true
      }
      catch (error) {
        console.error('Error removing background:', error)
        this.error = 'Failed to remove background'
        return false
      }
      finally {
        this.isLoading = false
      }
    },
  },
})
