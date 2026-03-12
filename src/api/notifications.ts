import apiClient from './client'
import { NotificationResponse } from '../types/notification'

export const notificationsApi = {
    getNotifications: async () => {
        const response = await apiClient.get<NotificationResponse[]>('/notifications')
        return response.data
    },

    markAsRead: async (id: string) => {
        const response = await apiClient.patch<NotificationResponse>(`/notifications/${id}/read`)
        return response.data
    }
}
