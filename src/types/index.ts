export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  tenant_id?: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
t: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parent_id?: string;
  head_id?: string;
  is_active: boolean;
  staff_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_type?: string;
  parent_project_id?: string;
  client_id?: string;
  project_manager_id: string;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  budget?: number;
  cost_estimate?: number;
  actual_cost: number;
  currency: string;
  progress_percentage: number;
  workflow_id?: string;
  location?: any;
  settings: Record<string, any>;
  custom_fields: Record<string, any>;
  is_template: boolean;
  template_id?: string;
  manager_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status_id?: string;
  status_name?: string;
  status_color?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  task_type?: string;
  estimated_hours?: number;
  actual_hours: number;
  estimated_cost?: number;
  actual_cost: number;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_by: string;
  assigned_by?: string;
  progress_percentage: number;
  milestone: boolean;
  billable: boolean;
  location?: any;
  custom_fields: Record<string, any>;
  tags: string[];
  deleted_at?: string;
  assignees: any[];
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  shift_id?: string;
  check_in?: string;
  check_out?: string;
  check_in_location?: any;
  check_out_location?: any;
  check_in_method?: string;
  check_out_method?: string;
  work_hours?: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  is_manual_entry: boolean;
  approved_by?: string;
  staff_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  documents: any[];
  staff_name?: string;
  leave_type_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_paid: boolean;
  color?: string;
  requires_approval: boolean;
  max_days_per_year?: number;
  carry_forward: boolean;
  is_active: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id: string;
  unit_of_measure: string;
  barcode?: string;
  manufacturer?: string;
  model_number?: string;
  cost_price?: number;
  selling_price?: number;
  reorder_level: number;
  reorder_quantity: number;
  is_trackable: boolean;
  is_consumable: boolean;
  is_active: boolean;
  custom_fields: Record<string, any>;
  deleted_at?: string;
  category_name?: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

export interface InventoryLocation {
  id: string;
  name: string;
  code?: string;
  description?: string;
  location_type: 'warehouse' | 'site' | 'vehicle';
  address?: any;
  manager_id?: string;
  is_active: boolean;
}

export interface ReimbursementClaim {
  id: string;
  claim_number: string;
  staff_id: string;
  project_id?: string;
  task_id?: string;
  claim_date: string;
  expense_date_start?: string;
  expense_date_end?: string;
  total_amount: number;
  currency: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  paid_at?: string;
  payment_reference?: string;
  staff_name?: string;
  items: ReimbursementItem[];
  created_at: string;
  updated_at: string;
}

export interface ReimbursementItem {
  id: string;
  category_id: string;
  expense_date: string;
  description: string;
  amount: number;
  quantity: number;
  unit_price?: number;
  tax_amount: number;
  merchant_name?: string;
  merchant_location?: string;
  receipt_file_id?: string;
  is_billable: boolean;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  requires_receipt: boolean;
  max_amount?: number;
  tax_deductible: boolean;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    request_id: string;
  };
}
