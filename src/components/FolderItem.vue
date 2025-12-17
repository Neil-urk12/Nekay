<script setup lang="ts">
import { Check, FolderOpen, MoreVertical, Pencil, Trash2, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

export interface FolderItemData {
  id: string
  name: string
  numOfItems?: number
}

const props = withDefaults(
  defineProps<{
    folder: FolderItemData
    itemLabel?: string
    showIcon?: boolean
    inlineEdit?: boolean
  }>(),
  {
    itemLabel: 'items',
    showIcon: true,
    inlineEdit: false,
  },
)

const emit = defineEmits<{
  (e: 'click', folder: FolderItemData): void
  (e: 'edit', folder: FolderItemData): void
  (e: 'delete', folder: FolderItemData): void
  (e: 'save', folder: FolderItemData): void
  (e: 'cancel'): void
}>()

// Inline edit state
const isEditing = ref(false)
const editName = ref('')

const itemCount = computed(() => props.folder.numOfItems || 0)

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

function startEdit() {
  showMenu.value = false
  swipeOffset.value = 0
  if (props.inlineEdit) {
    isEditing.value = true
    editName.value = props.folder.name
  }
  else {
    emit('edit', props.folder)
  }
}

function saveEdit() {
  if (!editName.value.trim())
    return
  emit('save', { ...props.folder, name: editName.value.trim() })
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
  emit('cancel')
}

function handleClick() {
  if (!isEditing.value) {
    emit('click', props.folder)
  }
}

function handleDelete() {
  showMenu.value = false
  swipeOffset.value = 0
  emit('delete', props.folder)
}
</script>

<template>
  <div class="folder-item-container">
    <!-- Background Actions (Visible on Swipe) -->
    <div
      class="swipe-actions"
      :style="{ opacity: swipeOffset < 0 ? 1 : 0, pointerEvents: swipeOffset < 0 ? 'auto' : 'none' }"
    >
      <Pencil class="swipe-btn edit-swipe-btn" :size="30" @click="startEdit" />
      <Trash2 class="swipe-btn delete-swipe-btn" :size="30" @click="handleDelete" />
    </div>

    <!-- Foreground Content (Swipeable) -->
    <div
      class="folder-item"
      :style="{ transform: `translateX(${swipeOffset}px)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @click="handleClick"
    >
      <!-- Optional Folder Icon -->
      <div v-if="showIcon" class="folder-icon">
        <slot name="icon">
          <FolderOpen :size="20" />
        </slot>
      </div>

      <!-- Folder Info -->
      <div class="folder-info">
        <template v-if="isEditing">
          <input
            v-model="editName"
            class="edit-input"
            autofocus
            @keyup.enter="saveEdit"
            @keyup.esc="cancelEdit"
            @click.stop
          >
        </template>
        <template v-else>
          <h3 class="folder-name">
            {{ folder.name }}
          </h3>
          <p class="folder-count">
            {{ itemCount }} {{ itemLabel }}
          </p>
        </template>
      </div>

      <!-- Inline Edit Actions -->
      <div v-if="isEditing" class="folder-actions" @click.stop>
        <button class="action-btn save-btn" title="Save" @click="saveEdit">
          <Check :size="18" />
        </button>
        <button class="action-btn cancel-btn" title="Cancel" @click="cancelEdit">
          <X :size="18" />
        </button>
      </div>

      <!-- Desktop Menu Trigger -->
      <div v-else ref="menuRef" class="desktop-menu-wrapper" @click.stop>
        <button class="action-btn menu-btn" @click="toggleMenu">
          <MoreVertical :size="18" />
        </button>

        <!-- Dropdown Menu -->
        <transition name="fade">
          <div v-if="showMenu" class="dropdown-menu">
            <button class="menu-item" @click="startEdit">
              <Pencil :size="16" />
              <span>Edit</span>
            </button>
            <button class="menu-item delete" @click="handleDelete">
              <Trash2 :size="16" />
              <span>Delete</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder-item-container {
  position: relative;
  margin-bottom: 0.5rem;
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  background: transparent;
  display:flex;
  justify-content: center;
}

/* Container for swipe context */
.swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 80px;
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
  background: #8b5cf6;
}

.delete-swipe-btn {
  background: #ef4444;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  width: 85%;
}

.folder-item:hover {
  background: rgba(255, 255, 255, 1);
}

.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-radius: 10px;
  color: #db2777;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

.folder-count {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.edit-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid #db2777;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  outline: none;
  transition: border-color 0.2s ease;
}

.edit-input:focus {
  border-color: #ec4899;
}

.folder-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.desktop-menu-wrapper {
  position: relative;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #64748b;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #334155;
}

.menu-btn {
  opacity: 0;
}

/* Show menu button on hover (Desktop) */
@media (hover: hover) {
  .folder-item:hover .menu-btn {
    opacity: 1;
  }
}

/* Always show on touch devices */
@media (hover: none) {
  .menu-btn {
    opacity: 0;
  }
}

.save-btn {
  color: #10b981;
}

.save-btn:hover {
  background: rgba(16, 185, 129, 0.1);
}

.cancel-btn {
  color: #64748b;
}

.cancel-btn:hover {
  background: rgba(100, 116, 139, 0.1);
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
