// src/api/user.ts
import apiClient from './client'

export interface CreateUserFromStaff {
  login_email: string
  role_id: string
  is_active: boolean
}

export const userApi = {
  createFromStaff: async (p0: string, data: CreateUserFromStaff) => {
    const response = await apiClient.post('/users', data)
    return response.data
  }
}
