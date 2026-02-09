export interface InventoryCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface InventorySupplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryWarehouse {
  id: number;
  name: string;
  location?: string;
  manager_id?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  tenant_id: number;
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  category_id?: number;
  category?: InventoryCategory;
  supplier_id?: number;
  supplier?: InventorySupplier;
  warehouse_id?: number;
  warehouse?: InventoryWarehouse;
  unit_of_measure: string;
  unit_cost: number;
  selling_price: number;
  quantity: number;
  min_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  location?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface StockMovement {
  id: number;
  tenant_id: number;
  item_id: number;
  item?: InventoryItem;
  movement_type: 'in' | 'out' | 'adjustment_in' | 'adjustment_out';
  quantity: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: number;
  reason?: string;
  created_by?: number;
  created_by_user?: {
    id: number;
    full_name: string;
  };
  created_at: string;
}

export interface InventoryAdjustment {
  quantity: number;
  type: 'in' | 'out';
  reason: string;
}

export interface InventoryFilters {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  warehouse_id?: number;
  status?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock';
  page?: number;
  limit?: number;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  pages: number;
}
