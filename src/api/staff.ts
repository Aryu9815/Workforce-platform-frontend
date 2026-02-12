import apiClient from './client'
import { Staff, Department, PaginatedResponse } from '../types'

export interface CreateStaffData {
  employee_code?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id: string
  designation_id: string
  reporting_manager_id?: string
  employment_type: 'full_time' | 'contractor' | 'vendor'
  join_date: string
  work_location?: string
  skills?: string[]
}

export interface UpdateStaffData {
  first_name?: string
  last_name?: string
  phone?: string
  department_id?: string
  designation_id?: string
  reporting_manager_id?: string
  employment_type?: 'full_time' | 'contractor' | 'vendor'
  work_location?: string
  skills?: string[]
  is_active?: boolean
}

export const staffApi = {
  getStaffList: async (params?: {
    page?: number
    page_size?: number
    department_id?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<Staff>> => {
    const response = await apiClient.get('/staff', { params })
    return response.data
  },
  
  getStaff: async (id: string): Promise<Staff> => {
    const response = await apiClient.get(`/staff/${id}`)
    return response.data
  },
  getDesignations: async () => {
    const response = await apiClient.get('/staff/designations')
    console.log('Designations response:', response.data)
    return response.data
  },

  createStaff: async (data: CreateStaffData): Promise<Staff> => {
    const response = await apiClient.post('/staff', data)
    return response.data
  },
  
  updateStaff: async (id: string, data: UpdateStaffData): Promise<Staff> => {
    const response = await apiClient.put(`/staff/${id}`, data)
    return response.data
  },
  
  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`)
  },
  
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get('/staff/departments')
    return response.data
  },
  
  getStaffNames: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get('/staffs/get_names')
    return response.data
  },
  
  createDepartment: async (data: {
    name: string
    code?: string
    description?: string
    parent_id?: string
  }): Promise<Department> => {
    const response = await apiClient.post('/staff/departments', data)
    return response.data
  },
  
  createUser: async (
  staffId: string,
  data: {
    role_id: string
    login_email: string
    is_active: boolean
  }
) => {
  const response = await apiClient.post(
    `/staff/${staffId}/users`,
    data
  )
  return response.data
},

  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.put(`/staff/departments/${id}`, data)
    return response.data
  },
}
