import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TypingEvent, TypingState } from '../composables/interfaces'
import { defineStore } from 'pinia'
import { supabase } from '../supabase/supabase-config'

interface TypingStoreState extends TypingState {
  typingChannel: RealtimeChannel | null
  typingTimeoutId: ReturnType<typeof setTimeout> | null
}

export const useTypingStore = defineStore('typing', {
  state: (): TypingStoreState => ({
    isOtherUserTyping: false,
    otherUserName: '',
    typingChannel: null,
    typingTimeoutId: null,
    currentUserId: null,
  }),

  actions: {
    /**
     * Broadcast typing status via Supabase Realtime Broadcast
     * No database writes - instant WebSocket pub/sub
     */
    broadcastTyping(isTyping: boolean) {
      if (!this.typingChannel || !this.currentUserId)
        return

      this.typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: this.currentUserId,
          isTyping,
        } as TypingEvent,
      })
    },

    /**
     * Setup broadcast channel for typing events
     */
    setupTypingListener(conversationId: string, currentUserId: string, otherUserName: string) {
      // Aggressive cleanup: clear everything before setting up new listener
      this.cleanupTypingListener()

      this.otherUserName = otherUserName
      this.currentUserId = currentUserId

      const channel = supabase.channel(`typing:${conversationId}`, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
        },
      })

      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        const typingEvent = payload as TypingEvent

        // Only care about the other user's typing status
        if (typingEvent.userId !== currentUserId) {
          this.isOtherUserTyping = typingEvent.isTyping

          // Auto-clear after 4 seconds as a fallback
          // (in case the other user's browser closed unexpectedly)
          if (typingEvent.isTyping) {
            this.clearTypingTimeout()
            this.typingTimeoutId = setTimeout(() => {
              this.isOtherUserTyping = false
            }, 4000)
          }
          else {
            this.clearTypingTimeout()
          }
        }
      })

      channel.subscribe()
      this.typingChannel = channel as RealtimeChannel
    },

    /**
     * Clear the auto-clear timeout
     */
    clearTypingTimeout() {
      if (this.typingTimeoutId) {
        clearTimeout(this.typingTimeoutId)
        this.typingTimeoutId = null
      }
    },

    /**
     * Aggressive cleanup - clears all state and resources
     * Call when switching conversations or unmounting
     */
    cleanupTypingListener() {
      // Clear timeout first
      this.clearTypingTimeout()

      // Broadcast stop typing before disconnecting (best effort)
      if (this.typingChannel && this.currentUserId) {
        this.typingChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: this.currentUserId, isTyping: false } as TypingEvent,
        })
      }

      // Remove channel
      if (this.typingChannel) {
        supabase.removeChannel(this.typingChannel as RealtimeChannel)
        this.typingChannel = null
      }

      // Reset all state
      this.isOtherUserTyping = false
      this.otherUserName = ''
      this.currentUserId = null
    },

    /**
     * Reset store state
     */
    $reset() {
      this.cleanupTypingListener()
    },
  },
})
