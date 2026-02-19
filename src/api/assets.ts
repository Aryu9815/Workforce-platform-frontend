import apiClient from './client'
import {
  Asset,
  AssetCategory,
  AssetType,
  PaginatedResponse,
} from '../types'

/* ============================
   CATEGORY
============================ */

export interface CreateAssetCategoryData {
  name: string
  code: string
  description?: string
}

/* ============================
   TYPE
============================ */

export interface CreateAssetTypeData {
  category_id: string
  name: string
  brand?: string
  model_number?: string
  is_serialized?: boolean
  purchase_cost?: number
  warranty_months?: number
  description?: string
}

/* ============================
   ASSETS
============================ */

export interface ListAssetsParams {
  page?: number
  page_size?: number
  asset_type_id?: string
  status?: string
}

export interface CreateAssetData {
  asset_type_id: string
  quantity?: number 
  serial_numbers?: string[]
  purchase_date?: string
  purchase_price?: number
  location?: string
  notes?: string
}


export interface AssignAssetData {
  staff_id: string
  assigned_date: string
  expected_return_date?: string
}


export interface ReturnAssetData {
  returned_date: string
  condition_on_return?: string
}

/* ============================
   API METHODS
============================ */

export const assetsApi = {
  /* ---------- CATEGORY ---------- */

  getCategories: async (): Promise<AssetCategory[]> => {
    const response = await apiClient.get('/assets/categories')
    return response.data
  },

  createCategory: async (
    data: CreateAssetCategoryData
  ): Promise<AssetCategory> => {
    const response = await apiClient.post('/assets/categories', data)
    return response.data
  },

  /* ---------- TYPE ---------- */

  getTypes: async (
    params?: { category_id?: string }
  ): Promise<AssetType[]> => {
    const response = await apiClient.get('/assets/types', { params })
    return response.data
  },

  createType: async (
    data: CreateAssetTypeData
  ): Promise<{ id: string; name: string }> => {
    const response = await apiClient.post('/assets/types', data)
    return response.data
  },

  /* ---------- ASSETS ---------- */

  getAssets: async (
    params?: ListAssetsParams
  ): Promise<PaginatedResponse<Asset>> => {
    const response = await apiClient.get('/assets', { params })
    return response.data
  },

  createAsset: async (
    data: CreateAssetData
  ): Promise<{ id: string; asset_tag: string; status: string }> => {
    const response = await apiClient.post('/assets', data)
    return response.data
  },

  assignAsset: async (
    assetId: string,
    data: AssignAssetData
  ): Promise<any> => {
    const response = await apiClient.post(
      `/assets/${assetId}/assign`,
      data
    )
    return response.data
  },

  returnAsset: async (
    assetId: string,
    data: ReturnAssetData
  ): Promise<any> => {
    const response = await apiClient.post(
      `/assets/${assetId}/return`,
      data
    )
    return response.data
  },
}
