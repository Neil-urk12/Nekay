<script setup lang="ts">
import {
  CircleX,
  MoreVertical,
  SquarePen,
} from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  showEdit?: boolean
  showDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'contentClick'): void
}>()

// -- Swipe Logic --
const swipeOffset = ref(0)
const startX = ref(0)
const SWIPE_THRESHOLD = -80 // Distance to snap open
const MAX_SWIPE = -120 // Max drag distance

function handleTouchStart(e: TouchEvent) {
  startX.value = e.touches[0].clientX
}

function handleTouchMove(e: TouchEvent) {
  const currentX = e.touches[0].clientX
  const diff = currentX - startX.value

  // Only allow swiping left
  if (diff < 0) {
    swipeOffset.value = Math.max(diff, MAX_SWIPE)
  }
  else {
    swipeOffset.value = 0
  }
}

function handleTouchEnd() {
  if (swipeOffset.value < SWIPE_THRESHOLD) {
    swipeOffset.value = SWIPE_THRESHOLD // Snap to open
  }
  else {
    swipeOffset.value = 0 // Snap back closed
  }
}

// -- Desktop Menu Logic --
const showMenu = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleEditClick() {
  showMenu.value = false
  swipeOffset.value = 0
  emit('edit')
}

function handleDeleteClick() {
  showMenu.value = false
  swipeOffset.value = 0
  emit('delete')
}
</script>

<template>
  <div class="swipeable-item-container">
    <!-- Background Actions (Visible on Swipe) -->
    <div
      class="swipe-actions"
      :style="{ opacity: swipeOffset < 0 ? 1 : 0, pointerEvents: swipeOffset < 0 ? 'auto' : 'none' }"
    >
      <button v-if="showEdit !== false" class="swipe-btn edit-swipe-btn" @click.stop="handleEditClick">
        <SquarePen :size="32" />
      </button>
      <button v-if="showDelete !== false" class="swipe-btn delete-swipe-btn" @click.stop="handleDeleteClick">
        <CircleX :size="32" />
      </button>
    </div>

    <!-- Foreground Content (Swipeable) -->
    <div
      class="item-content-card"
      :style="{ transform: `translateX(${swipeOffset}px)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @click="$emit('contentClick')"
    >
      <!-- Slot for Custom Content -->
      <slot />

      <!-- Desktop Menu Trigger -->
      <div ref="menuRef" class="desktop-menu-wrapper">
        <button class="action-btn menu-btn" @click.stop="toggleMenu">
          <MoreVertical :size="18" />
        </button>

        <!-- Dropdown Menu -->
        <transition name="fade">
          <div v-if="showMenu" class="dropdown-menu">
            <button v-if="showEdit !== false" class="menu-item" @click.stop="handleEditClick">
              <SquarePen :size="16" />
              <span>Edit</span>
            </button>
            <button v-if="showDelete !== false" class="menu-item delete" @click.stop="handleDeleteClick">
              <CircleX :size="16" />
              <span>Delete</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swipeable-item-container {
  position: relative;
  margin-bottom: 0.75rem;
  border-radius: 16px;
  width: 100%;
  overflow: hidden;
  background: transparent;
  display: flex;
  justify-content: center;
}

/* Container for swipe context */
.swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 90px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  gap: 0.5rem;
  z-index: 0;
  transition: opacity 0.2s ease;
}

.swipe-btn {
  padding: 0;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border-radius: 8px;
}

.swipe-btn svg {
  display: block;
}

.edit-swipe-btn {
  color: #3b82f6;
  /* Or handle background if preferred, but existing design had colored icons or bg.
     Keeping it simple or matching TaskItem.vue which had background colors:
  */
  background: #3b82f6;
  color: white;
  padding: 4px;
}
.delete-swipe-btn {
  background: #ef4444;
  color: white;
  padding: 4px;
}

.item-content-card {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  width: 95%; /* Responsive width */
  box-sizing: border-box;
  cursor: pointer;
}

.item-content-card:hover {
  background: #f8fafc;
}

/* Actions & Menu */
.desktop-menu-wrapper {
  position: relative;
  margin-left: auto; /* Push to right if slot doesn't fill */
}

.action-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #334155;
}

.menu-btn {
  opacity: 0;
}

@media (hover: hover) {
  .item-content-card:hover .menu-btn {
    opacity: 1;
  }
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  min-width: 120px;
  padding: 0.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f8fafc;
  color: #1e293b;
}

.menu-item.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
