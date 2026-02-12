import apiClient from './client'
import { Project, PaginatedResponse } from '../types'

export interface CreateProjectData {
  name: string
  code?: string
  description?: string
  status?: 'planning' | 'active' | 'on_hold' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  project_type?: string
  project_manager_id?: string
  parent_project_id?: string
  client_id?: string
  start_date?: string
  end_date?: string
  budget?: number
  currency?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: 'planning' | 'active' | 'on_hold' | 'completed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  start_date?: string
  end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  budget?: number
  cost_estimate?: number
  progress_percentage?: number
  project_manager_id?: string
}

export const projectsApi = {
  getProjects: async (params?: {
    page?: number
    page_size?: number
    status?: string
    priority?: string
    search?: string
  }): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/projects', { params })
    return response.data
  },
  
  getProject: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },
  
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post('/projects', data)
    return response.data
  },
  
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data)
    return response.data
  },
  
  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
  
  getProjectStats: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/projects/${id}/stats`)
    return response.data
  },
}
