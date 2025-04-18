import { defineStore } from 'pinia';
import { signInWithEmailAndPassword, onAuthStateChanged, AuthError, getAuth } from 'firebase/auth';
import { auth } from '../firebase/firebase-config';
import { User } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        email: '',
        password: '',
        error: '',
        isLoading: false,
        currentUser: null as User | null,
        authInitialized: false,
        uid: null as string | null,
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
        async setUser() {
            this.currentUser = localStorage.getItem("isAuthenticated") === "true" ? auth.currentUser : null;
            if (this.currentUser) {
                this.authInitialized = true;
                this.uid = this.currentUser.uid;
            }
        },
        async handleLogin() {
            if (!this.email || !this.password) {
                this.error = "Please enter both email and password";
                return;
            }

            try {
                this.isLoading = true;
                this.error = "";

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    this.email.trim(),
                    this.password.trim()
                );

                if (userCredential.user) {
                    this.currentUser = userCredential.user;
                    localStorage.setItem("isAuthenticated", "true");
                }
            } catch (err: any) {
                console.error("Login error:", err);
                const authError = err as AuthError;
                this.error = this.getErrorMessage(authError.code);
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
