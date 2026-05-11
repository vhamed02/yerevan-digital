'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import type { User, Store } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  sellerStore: Store | null
  isAuthenticated: boolean
  login: (data: { user: User; token: string; store?: Store }) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
  updateStore: (partial: Partial<Store>) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      sellerStore: null,
      isAuthenticated: false,

      login: ({ user, token, store }) => {
        Cookies.set('vendora_token', token, { expires: 30 })
        Cookies.set('vendora_role', user.role, { expires: 30 })
        set({ user, token, sellerStore: store ?? null, isAuthenticated: true })
      },

      logout: () => {
        Cookies.remove('vendora_token')
        Cookies.remove('vendora_role')
        set({ user: null, token: null, sellerStore: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      updateStore: (partial) =>
        set((state) => ({
          sellerStore: state.sellerStore ? { ...state.sellerStore, ...partial } : null,
        })),
    }),
    {
      name: 'vendora-auth',
      partialize: (state) => ({ user: state.user, token: state.token, sellerStore: state.sellerStore }),
    }
  )
)

export default useAuthStore
