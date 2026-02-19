import { create } from 'zustand'
import { persist } from 'zustand/middleware'
// @ts-ignore
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import type { AuthUser } from 'aws-amplify/auth'

interface AuthState {
    user: AuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    error: string | null

    // Actions
    setUser: (user: AuthUser | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    reset: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, _get) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,
            error: null,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user
            }),

            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error }),

            logout: async () => {
                try {
                    await signOut()
                    set({ user: null, isAuthenticated: false, error: null })
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Logout failed' })
                    throw error
                }
            },

            checkAuth: async () => {
                try {
                    const user = await getCurrentUser()
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    })
                } catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    })
                }
            },

            reset: () => set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }) // Only persist user data, not loading/error states
        }
    )
)