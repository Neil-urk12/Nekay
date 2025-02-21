<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase-config";
import { useRouter } from "vue-router";
import { AuthError } from "firebase/auth/cordova";

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const router = useRouter();

const getErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again later.";
    default:
      return "An error occurred during login. Please try again.";
  }
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = "Please enter both email and password";
    return;
  }

  try {
    isLoading.value = true;
    error.value = "";

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value.trim()
    );

    if (userCredential.user) {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/");
    }
  } catch (err: any) {
    console.error("Login error:", err);
    const authError = err as AuthError;
    error.value = getErrorMessage(authError.code);
  } finally {
    isLoading.value = false;
  }
};

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/");
    } else localStorage.removeItem("isAuthenticated");
  });
});

onUnmounted(async () => {
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
    });
  } catch (err) {
    console.error("Auth setup error: ", err);
  }
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Welcome Back!</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            required
            placeholder="Enter your email"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            required
            placeholder="Enter your password"
            :disabled="isLoading"
            autocomplete="current-password"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  border: 4px solid #fbcfe8;
}

h1 {
  color: rgb(219, 39, 119);
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.75rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
}

input {
  padding: 0.75rem;
  border: 1px solid #fbcfe8;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: rgb(219, 39, 119);
}

input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 0.5rem;
}

.login-button {
  background-color: rgb(219, 39, 119);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-button:hover:not(:disabled) {
  background-color: rgb(190, 24, 93);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .login-card {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
