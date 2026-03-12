import apiClient from './client'

export interface GenerateMessageRequest {
  message: string
}

export interface GenerateMessageResponse {
  old_message?: string
  generated_message: string
}

export interface AIModelsResponse {
  openai: string[]
  ollama: string[]
}

export const aiApi = {
  getModels: async (): Promise<AIModelsResponse> => {
    const response = await apiClient.get('/ai/models')
    return response.data
  },

  generateMessage: async (payload: GenerateMessageRequest): Promise<GenerateMessageResponse> => {
    const response = await apiClient.post('/ai/generate-message', payload)
    return response.data
  },

  regenerateMessage: async (payload: GenerateMessageRequest): Promise<GenerateMessageResponse> => {
    const response = await apiClient.post('/ai/regenerate-message', payload)
    return response.data
  }
}