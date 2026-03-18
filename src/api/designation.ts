import apiClient from './client'
import { Designation } from '../types'

export interface CreateDesignationData {
  name: string
  level?: number
  department_id?: string
  description?: string
}

export interface UpdateDesignationData extends Partial<CreateDesignationData> {
  is_active?: boolean
}

export const designationApi = {
  getDesignations: async (isDropdown: boolean = false): Promise<Designation[]> => {
    const response = await apiClient.get('/staff/designations', { params: { is_dropdown: isDropdown } })
    return response.data
  },

  getDesignation: async (id: string): Promise<Designation> => {
    const designations = await designationApi.getDesignations(true)
    const designation = designations.find(d => d.id === id)
    if (!designation) {
      throw new Error('Designation not found')
    }
    return designation
  },

  createDesignation: async (data: CreateDesignationData): Promise<Designation> => {
    const response = await apiClient.post('/staff/designations', data)
    return response.data
  },

  updateDesignation: async (id: string, data: UpdateDesignationData): Promise<Designation> => {
    const response = await apiClient.put(`/staff/designations/${id}`, data)
    return response.data
  },

  deleteDesignation: async (id: string): Promise<void> => {
    await apiClient.put(`/staff/designations/${id}`, { is_active: false })
  },
}
