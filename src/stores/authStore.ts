import { defineStore } from 'pinia';
import { supabase } from '../supabase/supabase-config';
import type { User, AuthError } from '@supabase/supabase-js';

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
            return (errorMessage: string) => {
                // Map common Supabase auth error messages
                if (errorMessage.includes('Invalid login credentials')) {
                    return 'Invalid email or password. Please check your credentials and try again.';
                }
                if (errorMessage.includes('Email not confirmed')) {
                    return 'Please confirm your email before logging in.';
                }
                if (errorMessage.includes('User not found')) {
                    return 'No account found with this email address.';
                }
                if (errorMessage.includes('Invalid email')) {
                    return 'Please enter a valid email address.';
                }
                if (errorMessage.includes('too many requests')) {
                    return 'Too many failed login attempts. Please try again later.';
                }
                return errorMessage || 'An error occurred during login. Please try again.';
            };
        },
        getCurrentUserId: (state) => state.currentUser?.id || null,
        isAuthenticated: (state) => !!state.currentUser
    },

    actions: {
        async setUser() {
            const { data: { session } } = await supabase.auth.getSession();
            this.currentUser = session?.user || null;
            if (this.currentUser) {
                this.authInitialized = true;
                this.uid = this.currentUser.id;
                localStorage.setItem('isAuthenticated', 'true');
            } else {
                localStorage.setItem('isAuthenticated', 'false');
            }
        },

        async handleLogin() {
            if (!this.email || !this.password) {
                this.error = 'Please enter both email and password';
                return;
            }

            try {
                this.isLoading = true;
                this.error = '';

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: this.email.trim(),
                    password: this.password.trim(),
                });

                if (error) {
                    throw error;
                }

                if (data.user) {
                    this.currentUser = data.user;
                    this.uid = data.user.id;
                    localStorage.setItem('isAuthenticated', 'true');
                }
            } catch (err: unknown) {
                console.error('Login error:', err);
                const authError = err as AuthError;
                this.error = this.getErrorMessage(authError.message);
            } finally {
                this.isLoading = false;
            }
        },

        async handleLogout() {
            try {
                await supabase.auth.signOut();
                this.currentUser = null;
                this.uid = null;
                localStorage.setItem('isAuthenticated', 'false');
            } catch (err) {
                console.error('Logout error:', err);
            }
        },

        async setupAuthListener() {
            this.authInitialized = false;

            return new Promise<void>((resolve) => {
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    (_event, session) => {
                        this.currentUser = session?.user || null;
                        this.uid = session?.user?.id || null;
                        this.authInitialized = true;

                        if (session?.user) {
                            localStorage.setItem('isAuthenticated', 'true');
                        } else {
                            localStorage.setItem('isAuthenticated', 'false');
                        }

                        resolve();
                    }
                );

                // Store subscription for cleanup if needed
                (this as any)._authSubscription = subscription;
            });
        },

        cleanup() {
            if ((this as any)._authSubscription) {
                (this as any)._authSubscription.unsubscribe();
            }
        }
    }
});
