import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'zustand/vanilla'
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

function makeAuthStore() {
  return createStore<AuthState>()((set) => ({
    user:            null,
    token:           null,
    sellerStore:     null,
    isAuthenticated: false,

    login: ({ user, token, store }) => {
      set({ user, token, sellerStore: store ?? null, isAuthenticated: true })
    },

    logout: () => {
      set({ user: null, token: null, sellerStore: null, isAuthenticated: false })
    },

    updateUser: (partial) =>
      set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

    updateStore: (partial) =>
      set((state) => ({
        sellerStore: state.sellerStore ? { ...state.sellerStore, ...partial } : null,
      })),
  }))
}

const mockUser: User = {
  id:   1,
  name: 'Anna Grigoryan',
  email: 'anna@example.com',
  role: 'seller',
}

describe('auth.store', () => {
  let store: ReturnType<typeof makeAuthStore>

  beforeEach(() => {
    store = makeAuthStore()
  })

  it('starts unauthenticated', () => {
    const { isAuthenticated, user, token } = store.getState()
    expect(isAuthenticated).toBe(false)
    expect(user).toBeNull()
    expect(token).toBeNull()
  })

  it('login sets user and token', () => {
    store.getState().login({ user: mockUser, token: 'tok-123' })
    const state = store.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('anna@example.com')
    expect(state.token).toBe('tok-123')
  })

  it('login stores sellerStore when provided', () => {
    const sellerStore = { id: 1, name: 'My Store', slug: 'my-store', status: 'active' } as Store
    store.getState().login({ user: mockUser, token: 'tok-123', store: sellerStore })
    expect(store.getState().sellerStore?.slug).toBe('my-store')
  })

  it('logout clears all auth state', () => {
    store.getState().login({ user: mockUser, token: 'tok-123' })
    store.getState().logout()
    const state = store.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.sellerStore).toBeNull()
  })

  it('updateUser merges partial update', () => {
    store.getState().login({ user: mockUser, token: 'tok' })
    store.getState().updateUser({ name: 'Ani' })
    expect(store.getState().user?.name).toBe('Ani')
    expect(store.getState().user?.email).toBe('anna@example.com')
  })

  it('updateUser is a no-op when not logged in', () => {
    store.getState().updateUser({ name: 'Ghost' })
    expect(store.getState().user).toBeNull()
  })
})
