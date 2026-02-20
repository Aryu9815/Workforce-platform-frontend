import apiClient from './client'
import { User, Tenant } from '../types'

export interface LoginCredentials {
  email: string
  password: string
  tenant_id?: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  tenant: Tenant
  multiple_tenants_found?: boolean
  permissions?: string[]
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },
  
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },
  
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken })
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
  
  getUserTenants: async (): Promise<Tenant[]> => {
    const response = await apiClient.get('/auth/tenants')
    return response.data
  },
  
  switchTenant: async (tenantId: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/switch-tenant', null, {
      params: { tenant_id: tenantId }
    })
    return response.data
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
  },
}
