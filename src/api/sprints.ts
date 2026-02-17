import apiClient from './client'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal?: string
  start_date: string
  end_date: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  capacity?: number
}

export interface SprintCreate {
  project_id: string
  name: string
  goal?: string
  start_date: string
  end_date: string
  status?: 'planned' | 'active' | 'completed' | 'cancelled'
  capacity?: number
}

export interface SprintUpdate {
  name?: string
  goal?: string
  start_date?: string
  end_date?: string
  status?: 'planned' | 'active' | 'completed' | 'cancelled'
  capacity?: number
}

export const sprintsApi = {
  listSprints: async (params?: { project_id?: string }): Promise<Sprint[]> => {
    const response = await apiClient.get('/sprints', { params })
    return response.data.items || []
  },
  getSprint: async (id: string): Promise<Sprint> => {
    const response = await apiClient.get(`/sprints/${id}`)
    return response.data
  },
  createSprint: async (data: SprintCreate): Promise<Sprint> => {
    const response = await apiClient.post('/sprints', data)
    return response.data
  },
  updateSprint: async (id: string, data: SprintUpdate): Promise<Sprint> => {
    const response = await apiClient.put(`/sprints/${id}`, data)
    return response.data
  },
  deleteSprint: async (id: string): Promise<void> => {
    await apiClient.delete(`/sprints/${id}`)
  },
}
