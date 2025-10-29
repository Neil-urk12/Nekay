import { defineStore } from 'pinia';
import { signInWithEmailAndPassword, onAuthStateChanged, AuthError, getAuth } from 'firebase/auth';
import { auth } from '../firebase/firebase-config';
import { User } from 'firebase/auth';

interface LoginAttempt {
  timestamp: number;
  count: number;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export const useAuthStore = defineStore('auth', {
    state: () => ({
        email: '',
        password: '',
        error: '',
        isLoading: false,
        currentUser: null as User | null,
        authInitialized: false,
        uid: null as string | null,
        loginAttempts: { timestamp: 0, count: 0 } as LoginAttempt,
    }),

    getters: {
        getErrorMessage: () => {
            return (errorCode: string) => {
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
        },
        getCurrentUserId: (state) => state.currentUser?.uid || null,
        isAuthenticated: (state) => !!state.currentUser
    },

    actions: {
        checkRateLimit(): boolean {
            const now = Date.now();

            // Reset counter if window has passed
            if (now - this.loginAttempts.timestamp > RATE_LIMIT_WINDOW) {
                this.loginAttempts = { timestamp: now, count: 0 };
            }

            return this.loginAttempts.count < MAX_ATTEMPTS;
        },

        recordLoginAttempt() {
            const now = Date.now();
            if (now - this.loginAttempts.timestamp > RATE_LIMIT_WINDOW) {
                this.loginAttempts = { timestamp: now, count: 1 };
            } else {
                this.loginAttempts.count++;
            }
        },

        async setUser() {
            this.currentUser = localStorage.getItem("isAuthenticated") === "true" ? auth.currentUser : null;
            if (this.currentUser) {
                this.authInitialized = true;
                this.uid = this.currentUser.uid;
            }
        },
        async handleLogin() {
            // Input validation
            if (!this.email || !this.password) {
                this.error = "Please enter both email and password";
                return;
            }

            const trimmedEmail = this.email.trim();
            const trimmedPassword = this.password.trim();

            // Basic email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                this.error = "Please enter a valid email address";
                return;
            }

            // Rate limiting check
            if (!this.checkRateLimit()) {
                this.error = "Too many failed login attempts. Please try again in 15 minutes.";
                return;
            }

            try {
                this.isLoading = true;
                this.error = "";

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    trimmedEmail,
                    trimmedPassword
                );

                if (userCredential.user) {
                    this.currentUser = userCredential.user;
                    localStorage.setItem("isAuthenticated", "true");
                    // Reset login attempts on success
                    this.loginAttempts = { timestamp: 0, count: 0 };
                    // Clear password from memory
                    this.password = "";
                }
            } catch (err: any) {
                console.error("Login error:", err);
                this.recordLoginAttempt();
                const authError = err as AuthError;
                this.error = this.getErrorMessage(authError.code);
                // Clear password on error for security
                this.password = "";
            } finally {
                this.isLoading = false;
            }
        },

        async setupAuthListener() {
            const auth = getAuth()
            if (!auth) {
                console.error("Auth instance not found.")
                return;
            }
            this.authInitialized = false
            return new Promise<void>((resolve) => {
                onAuthStateChanged(auth, (user) => {
                    this.currentUser = user || null
                    this.authInitialized = true
                    resolve();
                });
            })
        }
    }
});
