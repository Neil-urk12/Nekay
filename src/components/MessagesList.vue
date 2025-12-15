<template>
  <RecycleScroller
    ref="scrollerRef"
    :items="messages"
    :item-size="60"
    :min-item-size="40"
    :variable="true"
    key-field="id"
    class="messages-list"
  >
    <template #default="{ item: message }">
      <div :class="['message', { 'message-self': message.isSelf }]">
        <div class="message-content" @click="$emit('toggle', message.id)">
          {{ message.content }}
          <div
            class="message-timestamp"
            :class="{ 'timestamp-visible': messageTimestampsVisible[message.id] }"
          >
            {{ new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </div>
          <div class="message-status" v-if="message.isSelf"><CheckCheck :size="14" /></div>
        </div>
      </div>
    </template>
  </RecycleScroller>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import { CheckCheck } from 'lucide-vue-next'

const props = defineProps<{ messages: any[]; messageTimestampsVisible: Record<string, boolean> }>()
const scrollerRef = ref<any>(null)

watch(
  () => props.messages.length,
  (len) => {
    nextTick(() => scrollerRef.value?.scrollToItem(len - 1))
  }
)
</script>
