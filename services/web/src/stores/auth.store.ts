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
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
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
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: ({ user, token, store }) => {
        Cookies.set('yerevan_digital_token', token, { expires: 30 })
        Cookies.set('yerevan_digital_role', user.role, { expires: 30 })
        set({ user, token, sellerStore: store ?? null, isAuthenticated: true })
      },

      logout: () => {
        Cookies.remove('yerevan_digital_token')
        Cookies.remove('yerevan_digital_role')
        set({ user: null, token: null, sellerStore: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      updateStore: (partial) =>
        set((state) => ({
          sellerStore: { ...(state.sellerStore ?? {}), ...partial } as Store,
        })),
    }),
    {
      name: 'yerevan-digital-auth',
      partialize: (state) => ({ user: state.user, token: state.token, sellerStore: state.sellerStore, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export default useAuthStore
