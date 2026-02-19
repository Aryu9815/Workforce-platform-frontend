import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Laptop, RefreshCcw } from 'lucide-react'
import { assetsApi } from '../../api/assets'
import { staffApi } from '../../api/staff'
import {
  Asset,
  AssetCategory,
  AssetType,
  PaginatedResponse,
  Staff,
} from '../../types'

const AssetsPage = () => {
  const queryClient = useQueryClient()

  const assetPage = 1
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [assetTypeFilter, setAssetTypeFilter] = useState<string | undefined>()

  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateType, setShowCreateType] = useState(false)
  const [showCreateAsset, setShowCreateAsset] = useState(false)
  const [showAssignAsset, setShowAssignAsset] = useState(false)
  const [showReturnAsset, setShowReturnAsset] = useState(false)

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const [newCategory, setNewCategory] = useState({
    name: '',
    code: '',
    description: '',
  })

  const [newType, setNewType] = useState({
    category_id: '',
    name: '',
    brand: '',
    model_number: '',
    is_serialized: true,
    purchase_cost: '',
    warranty_months: '',
    description: '',
  })

  const [newAsset, setNewAsset] = useState({
    asset_type_id: '',
    quantity: 1,
    serial_numbers: [] as string[],
    purchase_date: '',
    purchase_price: '',
    location: '',
    notes: '',
  })

  const [assignmentForm, setAssignmentForm] = useState({
    staff_id: '',
    assigned_date: '',
    expected_return_date: '',
  })

  const [returnForm, setReturnForm] = useState({
    returned_date: '',
    condition_on_return: '',
  })

  const [search, setSearch] = useState('')

  const { data: categoriesData } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => assetsApi.getCategories(),
  })

  const { data: typesData } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetsApi.getTypes(),
  })

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () =>
      staffApi.getStaffList({
        page: 1,
        page_size: 100,
      }),
  })

  const { data: assetsData, isLoading: assetsLoading, refetch: refetchAssets } =
    useQuery<PaginatedResponse<Asset>>({
      queryKey: ['assets', assetPage, statusFilter, assetTypeFilter],
      queryFn: () =>
        assetsApi.getAssets({
          page: assetPage,
          page_size: 20,
          status: statusFilter,
          asset_type_id: assetTypeFilter,
        }),
    })

  const createCategoryMutation = useMutation({
    mutationFn: assetsApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
      setShowCreateCategory(false)
      setNewCategory({ name: '', code: '', description: '' })
    },
  })

  const createTypeMutation = useMutation({
    mutationFn: assetsApi.createType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-types'] })
      setShowCreateType(false)
      setNewType({
        category_id: '',
        name: '',
        brand: '',
        model_number: '',
        is_serialized: true,
        purchase_cost: '',
        warranty_months: '',
        description: '',
      })
    },
  })

  const createAssetMutation = useMutation({
    mutationFn: assetsApi.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setShowCreateAsset(false)
      setNewAsset({
        asset_type_id: '',
        quantity: 1,
        serial_numbers: [] as string[],
        purchase_date: '',
        purchase_price: '',
        location: '',
        notes: '',
      })
    },
  })

  const assignAssetMutation = useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string
      data: { staff_id: string; assigned_date: string; expected_return_date?: string }
    }) => assetsApi.assignAsset(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setShowAssignAsset(false)
      setAssignmentForm({
        staff_id: '',
        assigned_date: '',
        expected_return_date: '',
      })
      setSelectedAsset(null)
    },
  })

  const returnAssetMutation = useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string
      data: { returned_date: string; condition_on_return?: string }
    }) => assetsApi.returnAsset(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setShowReturnAsset(false)
      setReturnForm({
        returned_date: '',
        condition_on_return: '',
      })
      setSelectedAsset(null)
    },
  })

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    createCategoryMutation.mutate({
      name: newCategory.name,
      code: newCategory.code,
      description: newCategory.description || undefined,
    })
  }

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newType.category_id) return

    createTypeMutation.mutate({
      category_id: newType.category_id,
      name: newType.name,
      brand: newType.brand || undefined,
      model_number: newType.model_number || undefined,
      is_serialized: newType.is_serialized,
      purchase_cost: newType.purchase_cost
        ? Number(newType.purchase_cost)
        : undefined,
      warranty_months: newType.warranty_months
        ? Number(newType.warranty_months)
        : undefined,
      description: newType.description || undefined,
    })
  }

  const handleCreateAsset = (e: React.FormEvent) => {
  e.preventDefault()

  if (!newAsset.asset_type_id) return

  createAssetMutation.mutate({
    asset_type_id: newAsset.asset_type_id,
    quantity: newAsset.quantity,
    serial_numbers: selectedType?.is_serialized
      ? newAsset.serial_numbers
      : undefined,
    purchase_date: newAsset.purchase_date || undefined,
    purchase_price: newAsset.purchase_price
      ? Number(newAsset.purchase_price)
      : undefined,
    location: newAsset.location || undefined,
    notes: newAsset.notes || undefined,
  })
}


  const handleAssignAsset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset || !assignmentForm.staff_id || !assignmentForm.assigned_date) {
      return
    }

    assignAssetMutation.mutate({
      assetId: selectedAsset.id,
      data: {
        staff_id: assignmentForm.staff_id,
        assigned_date: assignmentForm.assigned_date,
        expected_return_date: assignmentForm.expected_return_date || undefined,
      },
    })
  }

  const handleReturnAsset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset || !returnForm.returned_date) {
      return
    }

    returnAssetMutation.mutate({
      assetId: selectedAsset.id,
      data: {
        returned_date: returnForm.returned_date,
        condition_on_return: returnForm.condition_on_return || undefined,
      },
    })
  }

  const filteredAssets = useMemo(() => {
    if (!assetsData?.items) return []
    if (!search) return assetsData.items
    const query = search.toLowerCase()
    return assetsData.items.filter(
      (a) =>
        a.asset_tag.toLowerCase().includes(query) ||
        (a.serial_number || '').toLowerCase().includes(query) ||
        (a.location || '').toLowerCase().includes(query)
    )
  }, [assetsData, search])

  const currentTypes = typesData || []
  const selectedType = currentTypes.find(
    (t: AssetType) => t.id === newAsset.asset_type_id
  )
  const currentCategories = categoriesData || []

  const staffOptions: Staff[] = staffData?.items || []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!assetsData?.items) return counts
    for (const asset of assetsData.items) {
      const key = asset.status || 'unknown'
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [assetsData])

  const groupedByType = useMemo(() => {
    if (!filteredAssets.length) return []

    const groups: Record<
      string,
      {
        type: AssetType | undefined
        assets: Asset[]
        available: number
        assigned: number
      }
    > = {}

    for (const asset of filteredAssets) {
      const key = asset.asset_type_id || 'unknown'
      if (!groups[key]) {
        const type = currentTypes.find((t: AssetType) => t.id === asset.asset_type_id)
        groups[key] = {
          type,
          assets: [],
          available: 0,
          assigned: 0,
        }
      }

      groups[key].assets.push(asset)

      if (asset.status === 'available') {
        groups[key].available += 1
      }
      if (asset.status === 'assigned') {
        groups[key].assigned += 1
      }
    }

    return Object.entries(groups)
      .sort(([, a], [, b]) =>
        (a.type?.name || '').localeCompare(b.type?.name || '')
      )
      .map(([key, value]) => ({ key, ...value }))
  }, [filteredAssets, currentTypes])

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'lost', label: 'Lost' },
    { value: 'disposed', label: 'Disposed' },
  ]

  useEffect(() => {
    refetchAssets()
  }, [assetPage, statusFilter, assetTypeFilter, refetchAssets])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-description">
            Track company assets and manage assignments
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => refetchAssets()}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCreateCategory(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Category
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCreateType(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Type
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCreateAsset(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Asset
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              className="input w-48"
              value={statusFilter || ''}
              onChange={(e) =>
                setStatusFilter(e.target.value || undefined)
              }
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="input w-56"
              value={assetTypeFilter || ''}
              onChange={(e) =>
                setAssetTypeFilter(e.target.value || undefined)
              }
            >
              <option value="">All types</option>
              {currentTypes.map((t: AssetType) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-secondary-600">
            <div className="flex items-center gap-1">
              <span className="uppercase text-xs text-secondary-500">Available</span>
              <span className="font-semibold">{statusCounts['available'] || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="uppercase text-xs text-secondary-500">Assigned</span>
              <span className="font-semibold">{statusCounts['assigned'] || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="uppercase text-xs text-secondary-500">Maintenance</span>
              <span className="font-semibold">{statusCounts['maintenance'] || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="uppercase text-xs text-secondary-500">Lost</span>
              <span className="font-semibold">{statusCounts['lost'] || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="uppercase text-xs text-secondary-500">Disposed</span>
              <span className="font-semibold">{statusCounts['disposed'] || 0}</span>
            </div>
          </div>

          <div className="border-t border-secondary-200 pt-4">
            {assetsLoading ? (
              <div className="text-center py-8">Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                No assets found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tag</th>
                      <th className="px-4 py-3">Serial</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Purchase</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white text-sm">
                    {groupedByType.map((group) => (
                      <Fragment key={group.key}>
                        <tr className="bg-secondary-50">
                          <td
                            className="px-4 py-2 text-xs font-semibold text-secondary-700"
                            colSpan={7}
                          >
                            <div className="flex items-center justify-between">
                              <span>{group.type?.name || 'Unknown type'}</span>
                              <div className="flex gap-4 text-[11px] uppercase text-secondary-500">
                                <span>Available: {group.available}</span>
                                <span>Assigned: {group.assigned}</span>
                                <span>Total: {group.assets.length}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {group.assets.map((asset) => (
                          <tr key={asset.id}>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-secondary-900">
                              <div className="flex items-center gap-2">
                                <Laptop className="h-4 w-4 text-secondary-400" />
                                {asset.asset_tag}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {asset.serial_number || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {group.type?.name || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap capitalize">
                              {asset.status}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {asset.location || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {asset.purchase_date || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              {asset.status === 'available' && (
                                <button
                                  type="button"
                                  className="btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedAsset(asset)
                                    setShowAssignAsset(true)
                                  }}
                                >
                                  Assign
                                </button>
                              )}
                              {asset.status === 'assigned' && (
                                <button
                                  type="button"
                                  className="btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedAsset(asset)
                                    setShowReturnAsset(true)
                                  }}
                                >
                                  Return
                                </button>
                              )}
                              {asset.status !== 'available' &&
                                asset.status !== 'assigned' && (
                                  <span className="text-xs text-secondary-500">
                                    {asset.status}
                                  </span>
                                )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">New Asset Category</h2>
                <button
                  type="button"
                  className="text-secondary-500 hover:text-secondary-800"
                  onClick={() => setShowCreateCategory(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="form-label">Name</label>
                  <input
                    className="input"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Code</label>
                  <input
                    className="input"
                    value={newCategory.code}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateCategory(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createCategoryMutation.isPending}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCreateType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">New Asset Type</h2>
                <button
                  type="button"
                  className="text-secondary-500 hover:text-secondary-800"
                  onClick={() => setShowCreateType(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateType} className="space-y-3">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="input"
                    value={newType.category_id}
                    onChange={(e) =>
                      setNewType((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {currentCategories.map((c: AssetCategory) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Name</label>
                  <input
                    className="input"
                    value={newType.name}
                    onChange={(e) =>
                      setNewType((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Brand</label>
                    <input
                      className="input"
                      value={newType.brand}
                      onChange={(e) =>
                        setNewType((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Model</label>
                    <input
                      className="input"
                      value={newType.model_number}
                      onChange={(e) =>
                        setNewType((prev) => ({
                          ...prev,
                          model_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Purchase cost</label>
                    <input
                      type="number"
                      className="input"
                      value={newType.purchase_cost}
                      onChange={(e) =>
                        setNewType((prev) => ({
                          ...prev,
                          purchase_cost: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Warranty (months)</label>
                    <input
                      type="number"
                      className="input"
                      value={newType.warranty_months}
                      onChange={(e) =>
                        setNewType((prev) => ({
                          ...prev,
                          warranty_months: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="is_serialized"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newType.is_serialized}
                    onChange={(e) =>
                      setNewType((prev) => ({
                        ...prev,
                        is_serialized: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="is_serialized" className="text-sm">
                    Track individual units (serialized)
                  </label>
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    value={newType.description}
                    onChange={(e) =>
                      setNewType((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateType(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createTypeMutation.isPending}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCreateAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">New Asset</h2>
                <button
                  type="button"
                  className="text-secondary-500 hover:text-secondary-800"
                  onClick={() => setShowCreateAsset(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateAsset} className="space-y-3">
                <div>
                  <label className="form-label">Asset type</label>
                  <select
                    className="input"
                    value={newAsset.asset_type_id}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        asset_type_id: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select type</option>
                    {currentTypes.map((t: AssetType) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={newAsset.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value)

                        setNewAsset((prev) => ({
                          ...prev,
                          quantity: qty,
                          serial_numbers: selectedType?.is_serialized
                            ? Array.from({ length: qty }, (_, i) => prev.serial_numbers[i] || '')
                            : [],
                        }))
                      }}

                    required
                  />
                </div>

                {selectedType?.is_serialized && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {Array.from({ length: newAsset.quantity }).map((_, index) => (
                      <div key={index}>
                        <label className="form-label">
                          Serial Number {index + 1}
                        </label>
                        <input
                          className="input"
                          value={newAsset.serial_numbers[index] || ''}
                          onChange={(e) => {
                            const updated = [...newAsset.serial_numbers]
                            updated[index] = e.target.value

                            setNewAsset((prev) => ({
                              ...prev,
                              serial_numbers: updated,
                            }))
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Purchase date</label>
                    <input
                      type="date"
                      className="input"
                      value={newAsset.purchase_date}
                      onChange={(e) =>
                        setNewAsset((prev) => ({
                          ...prev,
                          purchase_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Purchase price</label>
                    <input
                      type="number"
                      className="input"
                      value={newAsset.purchase_price}
                      onChange={(e) =>
                        setNewAsset((prev) => ({
                          ...prev,
                          purchase_price: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input
                    className="input"
                    value={newAsset.location}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="input"
                    value={newAsset.notes}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateAsset(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createAssetMutation.isPending}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAssignAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Assign asset {selectedAsset.asset_tag}
                </h2>
                <button
                  type="button"
                  className="text-secondary-500 hover:text-secondary-800"
                  onClick={() => {
                    setShowAssignAsset(false)
                    setSelectedAsset(null)
                  }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAssignAsset} className="space-y-3">
                <div>
                  <label className="form-label">Staff</label>
                  <select
                    className="input"
                    value={assignmentForm.staff_id}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        staff_id: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select staff</option>
                    {staffOptions.map((s: Staff) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.employee_code || s.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assigned date</label>
                  <input
                    type="date"
                    className="input"
                    value={assignmentForm.assigned_date}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        assigned_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Expected return date</label>
                  <input
                    type="date"
                    className="input"
                    value={assignmentForm.expected_return_date}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({
                        ...prev,
                        expected_return_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowAssignAsset(false)
                      setSelectedAsset(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={assignAssetMutation.isPending}
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showReturnAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Return asset {selectedAsset.asset_tag}
                </h2>
                <button
                  type="button"
                  className="text-secondary-500 hover:text-secondary-800"
                  onClick={() => {
                    setShowReturnAsset(false)
                    setSelectedAsset(null)
                  }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleReturnAsset} className="space-y-3">
                <div>
                  <label className="form-label">Returned date</label>
                  <input
                    type="date"
                    className="input"
                    value={returnForm.returned_date}
                    onChange={(e) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        returned_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Condition on return</label>
                  <textarea
                    className="input"
                    value={returnForm.condition_on_return}
                    onChange={(e) =>
                      setReturnForm((prev) => ({
                        ...prev,
                        condition_on_return: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowReturnAsset(false)
                      setSelectedAsset(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={returnAssetMutation.isPending}
                  >
                    Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetsPage
