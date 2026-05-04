/**
 * Admin Portal — standalone auth store
 * Uses 'admin-auth' persist key — completely separate from customer auth.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminAuthState {
  adminId: string | null
  isAuthenticated: boolean
  setAuth: (adminId: string, accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      adminId: null,
      isAuthenticated: false,

      setAuth: (adminId, accessToken, refreshToken) => {
        localStorage.setItem('admin_access_token', accessToken)
        localStorage.setItem('admin_refresh_token', refreshToken)
        set({ adminId, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        set({ adminId: null, isAuthenticated: false })
      },
    }),
    { name: 'admin-auth' }   // separate key — never clashes with customer session
  )
)
