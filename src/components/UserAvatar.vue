<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  avatarUrl?: string | null
  name?: string
  size?: number
}>(), {
  avatarUrl: null,
  name: '',
  size: 50,
})

const imageError = ref(false)

// Reset error state when avatarUrl changes so image load is re-attempted
watch(() => props.avatarUrl, () => {
  imageError.value = false
})

const initial = computed(() => {
  if (props.name)
    return props.name.charAt(0).toUpperCase()
  return '?'
})

const showImage = computed(() => props.avatarUrl && !imageError.value)

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * 0.4}px`,
}))

function handleImageError() {
  imageError.value = true
}
</script>

<template>
  <div class="user-avatar" :style="sizeStyle">
    <img
      v-if="showImage"
      :src="props.avatarUrl!"
      :alt="`${props.name}'s avatar`"
      class="avatar-image"
      @error="handleImageError"
    >
    <span v-else class="avatar-initial">{{ initial }}</span>
  </div>
</template>

<style scoped>
.user-avatar {
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
