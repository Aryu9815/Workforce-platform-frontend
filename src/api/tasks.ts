import apiClient from './client'
import { Task, PaginatedResponse } from '../types'

export interface CreateTaskData {
  project_id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  task_type?: string
  estimated_hours?: number
  estimated_cost?: number
  start_date?: string
  due_date?: string
  parent_task_id?: string
  status_id?: string
  assignee_ids?: string[]
  milestone?: boolean
  billable?: boolean
  tags?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  estimated_hours?: number
  actual_hours?: number
  due_date?: string
  completed_at?: string
  progress_percentage?: number
  billable?: boolean
  tags?: string[]
}

export const tasksApi = {
  getTasks: async (params?: {
    page?: number
    page_size?: number
    project_id?: string
    status_id?: string
    priority?: string
    assignee_id?: string
  }): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get('/tasks', { params })
    return response.data
  },
  
  getTask: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data
  },
  
  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post('/tasks', data)
    return response.data
  },
  
  updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}`, data)
    return response.data
  },
  
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },
  
  assignTask: async (id: string, assigneeIds: string[]): Promise<void> => {
    await apiClient.post(`/tasks/${id}/assign`, assigneeIds)
  },
}
