import apiClient from './client'
import { ReimbursementClaim, ExpenseCategory, PaginatedResponse } from '../types'

export interface CreateReimbursementItemData {
  category_id: string
  expense_date: string
  description: string
  amount: number
  quantity?: number
  unit_price?: number
  tax_amount?: number
  merchant_name?: string
  merchant_location?: string
  receipt_file_id?: string
  is_billable?: boolean
  project_id?: string
  task_id?: string
}

export interface CreateReimbursementClaimData {
  staff_id: string
  project_id?: string
  task_id?: string
  claim_date: string
  expense_date_start?: string
  expense_date_end?: string
  total_amount: number
  currency?: string
  description?: string
  items: CreateReimbursementItemData[]
}

export const reimbursementsApi = {
  getClaims: async (params?: {
    page?: number
    page_size?: number
    staff_id?: string
    status?: string
    project_id?: string
  }): Promise<PaginatedResponse<ReimbursementClaim>> => {
    const response = await apiClient.get('/reimbursements/claims', { params })
    return response.data
  },
  
  getClaim: async (id: string): Promise<ReimbursementClaim> => {
    const response = await apiClient.get(`/reimbursements/claims/${id}`)
    return response.data
  },
  
  createClaim: async (data: CreateReimbursementClaimData): Promise<ReimbursementClaim> => {
    const response = await apiClient.post('/reimbursements/claims', data)
    return response.data
  },
  
  submitClaim: async (id: string): Promise<ReimbursementClaim> => {
    const response = await apiClient.post(`/reimbursements/claims/${id}/submit`)
    return response.data
  },
  
  approveClaim: async (id: string, status: 'approved' | 'rejected', notes?: string): Promise<ReimbursementClaim> => {
    const response = await apiClient.post(`/reimbursements/claims/${id}/approve`, {
      status,
      approval_notes: notes
    })
    return response.data
  },
  
  markAsPaid: async (id: string, paymentReference: string): Promise<ReimbursementClaim> => {
    const response = await apiClient.post(`/reimbursements/claims/${id}/pay`, null, {
      params: { payment_reference: paymentReference }
    })
    return response.data
  },
  
  // Expense categories
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get('/reimbursements/categories')
    return response.data
  },
}
