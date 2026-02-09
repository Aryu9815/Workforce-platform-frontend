import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Tenant } from '../types'

interface AuthState {
  // State
  isAuthenticated: boolean
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
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      tenant: null,
      tenants: [],
      accessToken: null,
      refreshToken: null,
      permissions: [],
      
      // Actions
      setAuth: (data) => set({
        isAuthenticated: true,
        user: data.user,
        tenant: data.tenant || null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        permissions: data.permissions || [],
      }),
      
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
      
      hasPermission: (permission) => {
        const { permissions } = get()
        return permissions.includes(permission) || permissions.includes('admin.access')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
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
