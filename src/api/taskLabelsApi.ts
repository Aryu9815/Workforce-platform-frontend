import apiClient from './client'
import { TaskLabel, TaskLabelCreate, TaskLabelUpdate, PaginatedResponse } from '../types'

export const taskLabelsApi = {
  getTaskLabels: async (params?: {
    page?: number
    page_size?: number
    project_id?: string
  }): Promise<PaginatedResponse<TaskLabel>> => {
    const response = await apiClient.get('/task-labels', { params })
    return response.data
  },

  getTaskLabelsByProject: async (projectId: string): Promise<TaskLabel[]> => {
    const response = await apiClient.get(`/task-labels/project/${projectId}`)
    return response.data
  },

  getTaskLabel: async (id: string): Promise<TaskLabel> => {
    const response = await apiClient.get(`/task-labels/${id}`)
    return response.data
  },

  createTaskLabel: async (data: TaskLabelCreate): Promise<TaskLabel> => {
    const response = await apiClient.post('/task-labels', data)
    return response.data
  },

  updateTaskLabel: async (id: string, data: TaskLabelUpdate): Promise<TaskLabel> => {
    const response = await apiClient.put(`/task-labels/${id}`, data)
    return response.data
  },

  deleteTaskLabel: async (id: string): Promise<void> => {
    await apiClient.delete(`/task-labels/${id}`)
  },
}