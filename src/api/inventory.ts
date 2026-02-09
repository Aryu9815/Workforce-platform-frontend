import apiClient from './client'
import { InventoryItem, InventoryCategory, InventoryLocation, PaginatedResponse } from '../types'

export interface CreateInventoryItemData {
  sku: string
  name: string
  description?: string
  category_id: string
  unit_of_measure: string
  barcode?: string
  manufacturer?: string
  model_number?: string
  cost_price?: number
  selling_price?: number
  reorder_level?: number
  reorder_quantity?: number
  custom_fields?: Record<string, any>
}

export interface UpdateInventoryItemData {
  name?: string
  description?: string
  category_id?: string
  cost_price?: number
  selling_price?: number
  reorder_level?: number
  reorder_quantity?: number
  is_active?: boolean
}

export const inventoryApi = {
  getItems: async (params?: {
    page?: number
    page_size?: number
    category_id?: string
    location_id?: string
    low_stock?: boolean
    search?: string
  }): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await apiClient.get('/inventory/items', { params })
    return response.data
  },
  
  getItem: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get(`/inventory/items/${id}`)
    return response.data
  },
  
  createItem: async (data: CreateInventoryItemData): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory/items', data)
    return response.data
  },
  
  updateItem: async (id: string, data: UpdateInventoryItemData): Promise<InventoryItem> => {
    const response = await apiClient.put(`/inventory/items/${id}`, data)
    return response.data
  },
  
  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/items/${id}`)
  },
  
  // Stock
  getStock: async (params?: {
    item_id?: string
    location_id?: string
  }): Promise<any[]> => {
    const response = await apiClient.get('/inventory/stock', { params })
    return response.data
  },
  
  adjustStock: async (data: {
    item_id: string
    location_id: string
    quantity: number
    reason: string
  }): Promise<void> => {
    await apiClient.post('/inventory/stock/adjust', null, { params: data })
  },
  
  // Categories
  getCategories: async (): Promise<InventoryCategory[]> => {
    const response = await apiClient.get('/inventory/categories')
    return response.data
  },
  
  // Locations
  getLocations: async (): Promise<InventoryLocation[]> => {
    const response = await apiClient.get('/inventory/locations')
    return response.data
  },
}
