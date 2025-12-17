<script setup lang="ts">
import type { Task } from '../composables/interfaces'
import {
  Check,
  CircleX,
  MoreVertical,
  SquarePen,
} from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'toggle', task: Task): void
  (e: 'edit', task: Task): void
  (e: 'delete', taskId: string): void
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
  emit('edit', props.task)
}

function handleDeleteClick() {
  showMenu.value = false
  swipeOffset.value = 0
  emit('delete', props.task.id)
}
</script>

<template>
  <div
    class="task-card-container"
  >
    <!-- Background Actions (Visible on Swipe) -->
    <div
      class="swipe-actions"
      :style="{ opacity: swipeOffset < 0 ? 1 : 0, pointerEvents: swipeOffset < 0 ? 'auto' : 'none' }"
    >
      <SquarePen class="swipe-btn edit-swipe-btn" :size="32" @click="handleEditClick" />
      <CircleX class="swipe-btn delete-swipe-btn" :size="32" @click="handleDeleteClick" />
    </div>

    <!-- Foreground Content (Swipeable) -->
    <div
      class="task-card-content"
      :style="{ transform: `translateX(${swipeOffset}px)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Display Mode (Always active now, edit happens in sheet) -->
      <div class="checkbox-wrapper" @click="$emit('toggle', task)">
        <div class="custom-checkbox" :class="{ checked: task.completed }">
          <Check v-if="task.completed" :size="14" stroke-width="3" class="check-icon" />
        </div>
      </div>

      <span class="task-text" :class="{ 'text-completed': task.completed }" @click="$emit('toggle', task)">
        {{ task.taskContent }}
      </span>

      <!-- Desktop Menu Trigger -->
      <div ref="menuRef" class="desktop-menu-wrapper">
        <button class="action-btn menu-btn" @click.stop="toggleMenu">
          <MoreVertical :size="18" />
        </button>

        <!-- Dropdown Menu -->
        <transition name="fade">
          <div v-if="showMenu" class="dropdown-menu">
            <button class="menu-item" @click.stop="handleEditClick">
              <SquarePen :size="16" />
              <span>Edit</span>
            </button>
            <button class="menu-item delete" @click.stop="handleDeleteClick">
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
.task-card-container {
  position: relative;
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
  width: 80px; /* Match MAX_SWIPE approx */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.25rem;
  gap: 0.5rem;
  z-index: 0;
  transition: opacity 0.2s ease;
}

.swipe-btn {
  padding: 0.25rem;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.edit-swipe-btn {
  background: #3b82f6;
}
.delete-swipe-btn {
  background: #ef4444;
}

.task-card-content {
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
  z-index: 1; /* Sit above actions */
  width: 95%;
  box-sizing: border-box;
}

.task-card-content:hover {
  background: #f8fafc; /* Slight gray on hover */
}

.task-card-container.editing .task-card-content {
  background: white;
  box-shadow: 0 0 0 2px #db2777, 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Checkbox Styling */
.checkbox-wrapper {
  cursor: pointer;
  padding: 0.25rem;
  margin: -0.25rem;
  flex-shrink: 0;
}

.custom-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid #cbd5e1;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-wrapper:hover .custom-checkbox {
    border-color: #db2777;
}

.custom-checkbox.checked {
  background: #db2777;
  border-color: #db2777;
}

.check-icon {
  color: white;
}

/* Text Styling */
.task-text {
  flex: 1;
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  word-break: break-word;
}

.text-completed {
  text-decoration: line-through;
  color: #94a3b8;
}

/* Actions & Menu */
.desktop-menu-wrapper {
  position: relative;
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
  opacity: 0; /* Hidden by default */
}

/* Show menu button on hover (Desktop) */
@media (hover: hover) {
  .task-card-content:hover .menu-btn {
    opacity: 1;
  }
}

/* Always show menu button if menu is open or touch device fallbacks might need it (optional) */
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

/* Edit Mode Styles */
.edit-wrapper {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
}

.edit-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 500;
    padding: 0;
    outline: none;
    min-width: 0;
}
.edit-actions {
  display: flex;
  gap: 0.25rem;
}

.edit-input::placeholder {
    color: #94a3b8;
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
