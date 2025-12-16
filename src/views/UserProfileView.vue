<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase/supabase-config'
import { useAuthStore } from '../stores/authStore'
import SlideUpSheet from '../components/SlideUpSheet.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const userName = ref('')
const userEmail = ref('')
const showLogoutConfirm = ref(false)

// Edit State
const showEditName = ref(false)
const showEditEmail = ref(false)
const newName = ref('')
const newEmail = ref('')

// Password Change State
const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const userInitial = computed(() => {
  if (userName.value) return userName.value.charAt(0).toUpperCase()
  if (userEmail.value) return userEmail.value.charAt(0).toUpperCase()
  return '?'
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      userEmail.value = session.user.email || ''
      userName.value = session.user.user_metadata?.name || session.user.user_metadata?.full_name || ''
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
})

// Name Logic
const startEditName = () => {
  newName.value = userName.value
  showEditName.value = true
}

const saveName = async () => {
  if (!newName.value.trim()) return
  
  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      data: { name: newName.value.trim() }
    })
    
    if (error) throw error
    
    userName.value = newName.value.trim()
    showEditName.value = false
  } catch (error) {
    console.error('Error updating name:', error)
  } finally {
    loading.value = false
  }
}

// Email Logic
const startEditEmail = () => {
  newEmail.value = userEmail.value
  showEditEmail.value = true
}

const saveEmail = async () => {
  if (!newEmail.value.trim() || newEmail.value === userEmail.value) {
    showEditEmail.value = false
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail.value.trim()
    })

    if (error) throw error

    alert('A confirmation email has been sent to your new address. Please check your inbox to complete the update.')
    showEditEmail.value = false
  } catch (error: any) {
    console.error('Error updating email:', error)
    alert(error.message || 'Failed to update email')
  } finally {
    loading.value = false
  }
}

// Password Logic
const openChangePassword = () => {
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  passwordSuccess.value = ''
  showChangePassword.value = true
}

const savePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) throw error

    passwordSuccess.value = 'Password updated successfully'
    setTimeout(() => {
      showChangePassword.value = false
    }, 1500)
  } catch (error: any) {
    console.error('Error updating password:', error)
    passwordError.value = error.message || 'Failed to update password'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  loading.value = true
  try {
    await authStore.handleLogout()
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    loading.value = false
    showLogoutConfirm.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="background-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
    </div>

    <!-- Profile Card -->
    <div v-else class="profile-container">
      <div class="profile-card fade-in-up">
        <header class="card-header">
          <h1>My Profile</h1>
        </header>

        <div class="avatar-section">
          <div class="avatar-wrapper">
            <div class="avatar">
              {{ userInitial }}
            </div>
            <div class="avatar-glow"></div>
          </div>
          
          <div class="user-info">
            <!-- Name Section -->
            <div class="name-display">
              <h2 class="user-name">{{ userName || 'Set your name' }}</h2>
              <button class="edit-btn" @click="startEditName" title="Edit Name">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            </div>
            
            <!-- Email Section -->
            <div class="email-display">
              <p class="user-email">{{ userEmail }}</p>
              <button class="edit-btn" @click="startEditEmail" title="Edit Email">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="actions-section">
          <button class="action-btn change-password-btn" @click="openChangePassword">
            <span class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-lock"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <span>Change Password</span>
          </button>

          <button class="action-btn logout-btn" @click="showLogoutConfirm = true">
            <span class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Name Sheet -->
    <SlideUpSheet :show="showEditName" title="Edit Name" @close="showEditName = false">
      <div class="input-group">
        <label>Full Name</label>
        <input v-model="newName" type="text" placeholder="Enter your name" class="sheet-input" @keydown.enter="saveName" />
      </div>

      <button class="btn-save sheet-save-btn" @click="saveName" :disabled="loading">
        {{ loading ? 'Saving...' : 'Save Changes' }}
      </button>
    </SlideUpSheet>

    <!-- Edit Email Sheet -->
    <SlideUpSheet :show="showEditEmail" title="Edit Email" @close="showEditEmail = false">
      <div class="input-group">
        <label>Email Address</label>
        <input v-model="newEmail" type="email" placeholder="Enter your email" class="sheet-input" @keydown.enter="saveEmail" />
      </div>
      
      <p class="info-text">You will need to confirm the new email address.</p>

      <button class="btn-save sheet-save-btn" @click="saveEmail" :disabled="loading">
        {{ loading ? 'Saving...' : 'Update Email' }}
      </button>
    </SlideUpSheet>

    <!-- Slide-up Change Password Sheet -->
    <SlideUpSheet :show="showChangePassword" title="Change Password" @close="showChangePassword = false">
      <div class="input-group">
        <label>New Password</label>
        <input v-model="newPassword" type="password" placeholder="Min. 6 characters" class="sheet-input" />
      </div>
      
      <div class="input-group">
        <label>Confirm Password</label>
        <input v-model="confirmPassword" type="password" placeholder="Re-enter password" class="sheet-input" />
      </div>

      <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>
      <div v-if="passwordSuccess" class="success-msg">{{ passwordSuccess }}</div>

      <button class="btn-save sheet-save-btn" @click="savePassword" :disabled="loading">
        {{ loading ? 'Saving...' : 'Update Password' }}
      </button>
    </SlideUpSheet>

    <!-- Logout confirmation modal -->
    <transition name="modal">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-content">
          <div class="modal-header">
            <div class="warning-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3>Log Out?</h3>
          </div>
          <p>Are you sure you want to log out of your account?</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showLogoutConfirm = false">Cancel</button>
            <button class="btn-danger" @click="handleLogout">Log Out</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

.profile-page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #fff0f5 0%, #fce7f3 50%, #fbcfe8 100%);
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 60px; /* Space for bottom nav */
}

.background-shapes .shape {
  position: absolute;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
}

.shape-1 {
  top: -10%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: linear-gradient(to bottom left, #f9a8d4, #f472b6);
  border-radius: 50%;
  animation: float 20s infinite ease-in-out;
}

.shape-2 {
  bottom: -10%;
  left: -10%;
  width: 300px;
  height: 300px;
  background: linear-gradient(to top right, #fbcfe8, #f472b6);
  border-radius: 50%;
  animation: float 20s infinite ease-in-out reverse;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
  100% { transform: translate(0, 0); }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(219, 39, 119, 0.1);
  border-top-color: #db2777;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.profile-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  padding: 1.5rem;
}

.profile-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 2rem;
  padding: 2.5rem 2rem;
  box-shadow: 
    0 20px 40px -10px rgba(219, 39, 119, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f472b6, #db2777);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  box-shadow: 0 10px 25px -5px rgba(219, 39, 119, 0.4);
  position: relative;
  z-index: 2;
  border: 4px solid white;
}

.avatar-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(219, 39, 119, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

.user-info {
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.name-display, .email-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.user-name {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 700;
}

.user-email {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
}

.edit-btn {
  background: transparent;
  border: none;
  color: #db2777;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
  display: flex;
  align-items: center;
}

.edit-btn:hover {
  background: rgba(219, 39, 119, 0.1);
  opacity: 1;
}

.edit-btn svg {
  width: 16px;
  height: 16px;
}

.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #fbcfe8, transparent);
}

.actions-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: none;
}

.change-password-btn {
  background: white;
  color: #db2777;
  border: 2px solid #fbcfe8;
  box-shadow: 0 4px 15px -3px rgba(219, 39, 119, 0.1);
}

.change-password-btn:hover {
  background: #fdf2f8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -5px rgba(219, 39, 119, 0.2);
}

.logout-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 8px 20px -5px rgba(220, 38, 38, 0.3);
}

.logout-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px -8px rgba(220, 38, 38, 0.4);
}

.icon-wrapper svg {
  width: 20px;
  height: 20px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.warning-icon {
  width: 48px;
  height: 48px;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon svg {
  width: 24px;
  height: 24px;
}

.modal-content h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
  font-weight: 700;
}

.modal-content p {
  margin: 0 0 2rem;
  color: #6b7280;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Input and button styles for sheet content */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  margin-left: 0.25rem;
}

.sheet-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.sheet-input:focus {
  border-color: #db2777;
  background: #fdf2f8;
}

.sheet-save-btn {
  margin-top: 1rem;
  padding: 1rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 12px;
  background: #db2777;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.25);
}

.sheet-save-btn:hover {
  background: #be185d;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(219, 39, 119, 0.35);
}

.sheet-save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.info-text {
  color: #6b7280;
  font-size: 0.9rem;
  text-align: center;
  margin: -0.5rem 0 0;
}

.error-msg {
  color: #dc2626;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: #fee2e2;
  border-radius: 8px;
}

.success-msg {
  color: #059669;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: #d1fae5;
  border-radius: 8px;
}

.btn-save, .btn-cancel {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #db2777;
  color: white;
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.25);
}

.btn-save:hover {
  background: #be185d;
}

.btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-cancel:hover {
  background: #e5e7eb;
}
</style>
