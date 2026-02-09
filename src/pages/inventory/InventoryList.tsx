import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { inventoryApi } from '../../api/inventory'
import { InventoryItem } from '../../types'

const InventoryList = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, showLowStock],
    queryFn: () => inventoryApi.getItems({
      page,
      page_size: 20,
      search: search || undefined,
      low_stock: showLowStock || undefined,
    }),
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-description">Manage your organization's inventory</p>
        </div>
        <Link to="/inventory/new" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Add Item
        </Link>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-600">Show low stock only</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Items grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : data?.items.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-8">
            <Package className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500">No inventory items found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map((item: InventoryItem) => {
            const isLowStock = item.stock_quantity <= item.reorder_level
            
            return (
              <Link
                key={item.id}
                to={`/inventory/${item.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-secondary-500">{item.sku}</p>
                      <h3 className="text-lg font-semibold text-secondary-900 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-secondary-500">
                        {item.category_name || 'Uncategorized'}
                      </p>
                    </div>
                    {isLowStock && (
                      <div className="flex items-center text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary-500">Stock</p>
                      <p className={`text-lg font-semibold ${isLowStock ? 'text-amber-600' : 'text-secondary-900'}`}>
                        {item.stock_quantity} {item.unit_of_measure}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary-500">Reorder at</p>
                      <p className="text-sm text-secondary-700">
                        {item.reorder_level} {item.unit_of_measure}
                      </p>
                    </div>
                  </div>
                  
                  {item.cost_price && (
                    <div className="mt-3 pt-3 border-t border-secondary-200">
                      <p className="text-sm text-secondary-600">
                        Cost: ${item.cost_price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default InventoryList
