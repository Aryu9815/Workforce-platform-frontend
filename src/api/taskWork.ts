import apiClient from './client'
import { TaskWorkSession } from '../types'

export interface StartTaskWorkRequest {
  task_id: string
}

export const taskWorkApi = {
  start: async (payload: StartTaskWorkRequest): Promise<TaskWorkSession> => {
    const response = await apiClient.post('/task-work/start', payload)
    return response.data
  },

  stop: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/task-work/stop')
    return response.data
  },

  getMySessions: async (): Promise<TaskWorkSession[]> => {
    const response = await apiClient.get('/task-work/my-sessions')
    return response.data
  },

  getSessionsByAttendance: async (attendanceId: string): Promise<TaskWorkSession[]> => {
    const response = await apiClient.get(`/task-work/attendance/${attendanceId}`)
    return response.data
  }
}
