import apiClient from './client'
import { Project, PaginatedResponse, ProjectMember } from '../types'

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
    console.log(response.data)
    return response.data
  },
  
  getProjectMembers: async (id: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get(`/projects/${id}/members`)
    return response.data
  },
  getProjectMember: async (memberId: string): Promise<ProjectMember> => {
    const response = await apiClient.get(`/projects/member/${memberId}`)
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
  
  addProjectMember: async (
    data: { project_id: string; staff_id: string; role?: string; joined_at?: string }
  ): Promise<ProjectMember> => {
    const response = await apiClient.post(`/projects/member`, data)
    return response.data
  },
  updateProjectMember: async (
    memberId: string,
    data: { role?: string; joined_at?: string; left_at?: string }
  ): Promise<ProjectMember> => {
    const response = await apiClient.put(`/projects/member/${memberId}`, data)
    return response.data
  },
  deleteProjectMember: async (memberId: string): Promise<void> => {
    await apiClient.delete(`/projects/member/${memberId}`)  
  },
  
  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
  
  getProjectStats: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/projects/${id}/stats`)
    return response.data
  },
}
