import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Tenant } from '../types'

interface AuthState {
  // State
  isAuthenticated: boolean
  isloggedIn: boolean
  user: User | null
  tenant: Tenant | null
  tenants: Tenant[]
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]
  
  // Actions
  setAuth: (data: {
    user: User
    tenant?: Tenant
    accessToken: string
    refreshToken: string
    permissions?: string[]
  }) => void
  setTenant: (tenant: Tenant) => void
  setTenants: (tenants: Tenant[]) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setAuthenticated: () => void
  hasPermission: (permission: string) => boolean
  getPermissions: (value: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isloggedIn: false,
      user: null,
      tenant: null,
      tenants: [],
      accessToken: null,
      refreshToken: null,
      permissions: [],
      
      // Actions
      setAuth: (data) =>
        set((state) => ({
          isloggedIn: true,
          isAuthenticated: false,
          user: data.user,
          tenant: data.tenant || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          permissions: data.permissions ?? state.permissions,
        })),
      
      setTenant: (tenant) => set({ tenant }),
      
      setTenants: (tenants) => set({ tenants }),
      
      updateTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken,
      }),
      
      clearAuth: () => set({
        isAuthenticated: false,
        user: null,
        tenant: null,
        tenants: [],
        accessToken: null,
        refreshToken: null,
        permissions: [],
      }),

      setAuthenticated: () => set({ isAuthenticated: true }),

      hasPermission: (permission) => {
        const { permissions } = get()
        return permissions.includes(permission) || permissions.includes('admin.access')
      },

      getPermissions: (value) => {
        const { permissions } = get()
        return permissions.includes(value)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isloggedIn: state.isloggedIn,
        user: state.user,
        tenant: state.tenant,
        tenants: state.tenants,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
      }),
    }
  )
)
