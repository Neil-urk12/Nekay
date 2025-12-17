<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Theme options
const themes = [
  { id: 'default', name: 'Default', gradient: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { id: 'ocean', name: 'Ocean', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'forest', name: 'Forest', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'midnight', name: 'Midnight', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { id: 'rose', name: 'Rose', gradient: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
  { id: 'aurora', name: 'Aurora', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'lavender', name: 'Lavender', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
]

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('messaging-theme') || 'default'
const selectedTheme = ref(savedTheme)

function selectTheme(themeId: string) {
  selectedTheme.value = themeId
  localStorage.setItem('messaging-theme', themeId)
}

function getThemeGradient(themeId: string) {
  return themes.find(t => t.id === themeId)?.gradient || themes[0].gradient
}

function goBack() {
  router.push('/messaging')
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <h1 class="settings-title">Chat Settings</h1>
      <div class="spacer" />
    </div>

    <div class="settings-content">
      <section class="settings-section">
        <h2 class="section-title">Background Theme</h2>
        <p class="section-description">Choose a theme for your messaging background</p>

        <div class="theme-grid">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-card"
            :class="{ 'theme-selected': selectedTheme === theme.id }"
            :style="{ background: theme.gradient }"
            @click="selectTheme(theme.id)"
          >
            <span class="theme-name">{{ theme.name }}</span>
            <span v-if="selectedTheme === theme.id" class="check-icon">✓</span>
          </button>
        </div>
      </section>

      <section class="settings-section preview-section">
        <h2 class="section-title">Preview</h2>
        <div class="preview-container" :style="{ background: getThemeGradient(selectedTheme) }">
          <div class="preview-message preview-received">
            <span>Hey! How are you?</span>
          </div>
          <div class="preview-message preview-sent">
            <span>I'm doing great, thanks!</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  font-family: 'Inter', sans-serif;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #1a1a1a;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.settings-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.spacer {
  width: 2.5rem;
}

.settings-content {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.theme-card {
  position: relative;
  border: none;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.theme-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
}

.theme-card:hover::before {
  opacity: 1;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.theme-selected {
  ring: 3px solid #8a4fff;
  box-shadow: 0 0 0 3px #8a4fff, 0 8px 20px rgba(138, 79, 255, 0.3);
}

.theme-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.check-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: white;
  color: #8a4fff;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.preview-section {
  margin-top: 2rem;
}

.preview-container {
  border-radius: 20px;
  padding: 1.5rem;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-message {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease;
}

.preview-received {
  background: white;
  color: #2d3748;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-sent {
  background: linear-gradient(135deg, #8a4fff 0%, #6e3aff 100%);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 15px rgba(138, 79, 255, 0.25);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .theme-card {
    padding: 1.25rem 0.75rem;
  }
}
</style>
