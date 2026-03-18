import apiClient from './client'
import { Staff, Department, PaginatedResponse } from '../types'

export interface CreateStaffData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id: string
  designation_id: string
  role_id?: string
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
  role_id?: string
  reporting_manager_id?: string
  employment_type?: 'full_time' | 'contractor' | 'vendor'
  work_location?: string
  skills?: string[]
  is_active?: boolean
}

export interface ProfileAttendanceRecord {
  date: string
  status: string
  work_hours: number
  check_in?: string
  check_out?: string
}

export interface ProfileTenant {
  id: string
  name: string
  code: string
  is_active: boolean
}

export interface UserProfileData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department: string
  designation: string
  work_location?: string
  employment_type: string
  skills: string[]
  profile_image?: string
  reporting_manager_id?: string
  reporting_manager?: string
  join_date: string
  exit_date?: string
  exit_reason?: string
  is_active: boolean
  employee_code?: string
  user_id?: string
  emergency_contact?: any
  attendance_records: ProfileAttendanceRecord[]
  tenants: ProfileTenant[]
}

export const staffApi = {
  getProfile: async (staffId: string): Promise<UserProfileData> => {
    const response = await apiClient.get(`/staff/${staffId}/get_profile`)
    return response.data
  },
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
    return response.data
  },

  createStaff: async ({
    data,
    profileImage,
  }: {
    data: CreateStaffData
    profileImage?: File
  }): Promise<Staff> => {
    const formData = new FormData()
    formData.append('staff_data', JSON.stringify(data))
    if (profileImage) {
      formData.append('profile_image', profileImage)
    }
    const response = await apiClient.post('/staff', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  updateStaff: async ({
    id,
    data,
    profileImage,
  }: {
    id: string
    data: UpdateStaffData
    profileImage?: File
  }): Promise<Staff> => {
    const formData = new FormData()
    formData.append('staff_data', JSON.stringify(data))
    if (profileImage) {
      formData.append('profile_image', profileImage)
    }
    const response = await apiClient.put(`/staff/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`)
  },

  getDepartments: async (isDropdown: boolean = false): Promise<Department[]> => {
    const response = await apiClient.get('/staff/departments', { params: { is_dropdown: isDropdown } })
    return response.data
  },

  getStaffNames: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get('/staff/get-names')
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

  getProfileImage: async (filename: string): Promise<Blob> => {
    const response = await apiClient.get(`/staff/profile-image/${filename}`, {
      responseType: 'blob',
    })
    return response.data
  },
}
