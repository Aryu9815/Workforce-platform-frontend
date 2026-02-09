export interface ReimbursementCategory {
  id: number;
  name: string;
  description?: string;
  requires_receipt: boolean;
  max_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface Reimbursement {
  id: number;
  tenant_id: number;
  staff_id: number;
  staff?: {
    id: number;
    full_name: string;
    employee_id: string;
  };
  title: string;
  description?: string;
  category_id?: number;
  category?: ReimbursementCategory;
  amount: number;
  approved_amount?: number;
  expense_date: string;
  project_id?: number;
  project?: {
    id: number;
    name: string;
  };
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
  receipt_url?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  submitted_at?: string;
  approved_by?: {
    id: number;
    full_name: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  payment_details?: {
    payment_method: string;
    transaction_id: string;
    paid_date: string;
  };
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ApprovalHistory {
  id: number;
  reimbursement_id: number;
  action: 'submitted' | 'approved' | 'rejected' | 'paid' | 'updated';
  notes?: string;
  performed_by?: {
    id: number;
    full_name: string;
  };
  performed_at: string;
}

export interface ReimbursementApproval {
  notes?: string;
}

export interface ReimbursementRejection {
  reason: string;
}

export interface ReimbursementPayment {
  payment_method: string;
  transaction_id: string;
  paid_date: string;
}

export interface ReimbursementFilters {
  search?: string;
  status?: string;
  staff_id?: number;
  category_id?: number;
  department_id?: number;
  project_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ReimbursementListResponse {
  items: Reimbursement[];
  total: number;
  page: number;
  pages: number;
}
