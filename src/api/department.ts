import apiClient from './client'
import { Department } from '../types'

export interface CreateDepartmentData {
  name: string
  code?: string
  description?: string
  parent_id?: string
  head_id?: string
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {
  is_active?: boolean
}

export const departmentApi = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get('/staff/departments')
    return response.data
  },

  getDepartment: async (id: string): Promise<Department> => {
    const departments = await departmentApi.getDepartments()
    const department = departments.find(d => d.id === id)
    if (!department) {
      throw new Error('Department not found')
    }
    return department
  },

  createDepartment: async (data: CreateDepartmentData): Promise<Department> => {
    const response = await apiClient.post('/staff/departments', data)
    return response.data
  },

  updateDepartment: async (id: string, data: UpdateDepartmentData): Promise<Department> => {
    const response = await apiClient.put(`/staff/departments/${id}`, data)
    return response.data
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.put(`/staff/departments/${id}`, { is_active: false })
  },
}
