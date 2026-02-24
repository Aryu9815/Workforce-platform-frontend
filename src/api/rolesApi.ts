import apiClient from './client'
import { Role, RoleDetail, CreateRoleRequest, UpdateRoleRequest, Permission } from '../types'

export const rolesApi = {
  list: async (params?: { search?: string }): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/roles', { params })
    return response.data
  },

  get: async (id: string): Promise<RoleDetail> => {
    const response = await apiClient.get<RoleDetail>(`/roles/${id}`)
    return response.data
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post<Role>('/roles', data)
    return response.data
  },

  update: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await apiClient.put<Role>(`/roles/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`)
  },

  listPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>('/permissions')
    return response.data
  }
}
