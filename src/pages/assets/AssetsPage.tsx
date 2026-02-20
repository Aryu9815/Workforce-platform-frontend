import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi } from '../../api/assets'
import { staffApi } from '../../api/staff'
import {
  Asset,
  AssetCategory,
  AssetType,
  PaginatedResponse,
  Staff,
} from '../../types'
import { useAuthStore } from '@/store/authStore'
const AssetsPage = () => {
  const queryClient = useQueryClient()
  const getPermissions = useAuthStore(state => state.getPermissions)
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

  // -------- Mutations -------- //
  const createCategoryMutation = useMutation({
    mutationFn: assetsApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['asset-categories'])
      setShowCreateCategory(false)
      setNewCategory({ name: '', code: '', description: '' })
    },
  })

  const createTypeMutation = useMutation({
    mutationFn: assetsApi.createType,
    onSuccess: () => {
      queryClient.invalidateQueries(['asset-types'])
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
      queryClient.invalidateQueries(['assets'])
      setShowCreateAsset(false)
      setNewAsset({
        asset_type_id: '',
        quantity: 1,
        serial_numbers: [],
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
      data: {
        staff_id: string
        assigned_date: string
        expected_return_date?: string
      }
    }) => assetsApi.assignAsset(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets'])
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
      queryClient.invalidateQueries(['assets'])
      setShowReturnAsset(false)
      setReturnForm({
        returned_date: '',
        condition_on_return: '',
      })
      setSelectedAsset(null)
    },
  })

  // -------- Handlers -------- //
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
      serial_numbers:
        selectedType?.is_serialized === true
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
    if (!selectedAsset || !returnForm.returned_date) return

    returnAssetMutation.mutate({
      assetId: selectedAsset.id,
      data: {
        returned_date: returnForm.returned_date,
        condition_on_return: returnForm.condition_on_return || undefined,
      },
    })
  }

  // -------- Filtering & grouping -------- //
  const filteredAssets = useMemo(() => {
    if (!assetsData?.items) return []
    if (!search) return assetsData.items
    const q = search.toLowerCase()
    return assetsData.items.filter(
      a =>
        a.asset_tag.toLowerCase().includes(q) ||
        (a.serial_number || '').toLowerCase().includes(q) ||
        (a.location || '').toLowerCase().includes(q)
    )
  }, [search, assetsData])

  const currentTypes = typesData || []
  const selectedType = currentTypes.find((t: AssetType) => t.id === newAsset.asset_type_id)
  const currentCategories = categoriesData || []
  const staffOptions: Staff[] = staffData?.items || []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!assetsData?.items) return counts

    for (const a of assetsData.items) {
      const key = a.status || 'unknown'
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

    for (const a of filteredAssets) {
      const key = a.asset_type_id || 'unknown'
      if (!groups[key]) {
        const type = currentTypes.find((t: AssetType) => t.id === a.asset_type_id)
        groups[key] = {
          type,
          assets: [],
          available: 0,
          assigned: 0,
        }
      }

      groups[key].assets.push(a)

      if (a.status === 'available') groups[key].available++
      if (a.status === 'assigned') groups[key].assigned++
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
  }, [assetPage, statusFilter, assetTypeFilter])

  // ============================================================================
  const canViewAssets = getPermissions('asset:view')
  const canCreateAssets = getPermissions('asset:create')
  const canAssignAssets = getPermissions('asset:assign')

  if (!canViewAssets) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view assets.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500">
            Track company assets and manage assignments
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => refetchAssets()}
            className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100"
          >
            Refresh
          </button>
          {canCreateAssets && (
            <>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100"
              >
                New Category
              </button>
              <button
                onClick={() => setShowCreateType(true)}
                className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100"
              >
                New Type
              </button>
              <button
                onClick={() => setShowCreateAsset(true)}
                className="px-4 py-2 text-sm bg-teal-700 text-white rounded-md hover:bg-teal-800"
              >
                New Asset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-md bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">

          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-teal-600 outline-none text-sm"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter || ''}
            onChange={e => setStatusFilter(e.target.value || undefined)}
            className="px-3 py-2 border-b border-gray-300 focus:border-teal-600 outline-none text-sm w-48"
          >
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Type */}
          <select
            value={assetTypeFilter || ''}
            onChange={e => setAssetTypeFilter(e.target.value || undefined)}
            className="px-3 py-2 border-b border-gray-300 focus:border-teal-600 outline-none text-sm w-56"
          >
            <option value="">All Types</option>
            {currentTypes.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Counts */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Available: {statusCounts['available'] || 0}</span>
          <span>Assigned: {statusCounts['assigned'] || 0}</span>
          <span>Maintenance: {statusCounts['maintenance'] || 0}</span>
          <span>Lost: {statusCounts['lost'] || 0}</span>
          <span>Disposed: {statusCounts['disposed'] || 0}</span>
        </div>
      </div>

      {/* Assets Table */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">

        {assetsLoading ? (
          <div className="py-10 text-center text-gray-500">
            Loading assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No assets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Tag</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Serial</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Location</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Purchase</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {groupedByType.map(group => (
                  <Fragment key={group.key}>
                    {/* Group Header */}
                    <tr className="bg-gray-100">
                      <td className="px-4 py-2 font-semibold text-gray-700" colSpan={7}>
                        <div className="flex justify-between">
                          <span>{group.type?.name || 'Unknown type'}</span>
                          <div className="text-xs text-gray-500 flex gap-6">
                            <span>Available: {group.available}</span>
                            <span>Assigned: {group.assigned}</span>
                            <span>Total: {group.assets.length}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Asset Rows */}
                    {group.assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50">

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {asset.asset_tag}
                        </td>

                        <td className="px-4 py-3">
                          {asset.serial_number || '-'}
                        </td>

                        <td className="px-4 py-3">
                          {group.type?.name || '-'}
                        </td>

                        <td className="px-4 py-3 capitalize">
                          {asset.status}
                        </td>

                        <td className="px-4 py-3">
                          {asset.location || '-'}
                        </td>

                        <td className="px-4 py-3">
                          {asset.purchase_date || '-'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {asset.status === 'available' && canAssignAssets && (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset)
                                setShowAssignAsset(true)
                              }}
                              className="text-teal-700 hover:text-teal-800 text-sm"
                            >
                              Assign
                            </button>
                          )}

                          {asset.status === 'assigned' && canAssignAssets && (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset)
                                setShowReturnAsset(true)
                              }}
                              className="text-teal-700 hover:text-teal-800 text-sm"
                            >
                              Return
                            </button>
                          )}

                          {(asset.status !== 'available' &&
                            asset.status !== 'assigned') && (
                            <span className="text-gray-500 text-sm">
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

      {/* -------------------- MODALS BELOW -------------------- */}

      {/* Create Category */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-md border">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">New Asset Category</h2>
              <button
                onClick={() => setShowCreateCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">

              <div>
                <label className="text-sm text-gray-700">Name</label>
                <input
                  value={newCategory.name}
                  onChange={e =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:border-teal-600 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Code</label>
                <input
                  value={newCategory.code}
                  onChange={e =>
                    setNewCategory({ ...newCategory, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:border-teal-600 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={e =>
                    setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:border-teal-600 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCategory(false)}
                  className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="px-4 py-2 bg-teal-700 text-white rounded-md text-sm hover:bg-teal-800"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Create Type */}
      {showCreateType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-md border">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">New Asset Type</h2>
              <button
                onClick={() => setShowCreateType(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateType} className="space-y-4">

              <div>
                <label className="text-sm text-gray-700">Category</label>
                <select
                  value={newType.category_id}
                  onChange={e => setNewType({ ...newType, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:border-teal-600 outline-none text-sm"
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
                <label className="text-sm text-gray-700">Name</label>
                <input
                  value={newType.name}
                  onChange={e => setNewType({ ...newType, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:border-teal-600 outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Brand</label>
                  <input
                    value={newType.brand}
                    onChange={e => setNewType({ ...newType, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="text-sm">Model</label>
                  <input
                    value={newType.model_number}
                    onChange={e => setNewType({ ...newType, model_number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Purchase cost</label>
                  <input
                    type="number"
                    value={newType.purchase_cost}
                    onChange={e => setNewType({ ...newType, purchase_cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="text-sm">Warranty (months)</label>
                  <input
                    type="number"
                    value={newType.warranty_months}
                    onChange={e =>
                      setNewType({ ...newType, warranty_months: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_serialized"
                  type="checkbox"
                  checked={newType.is_serialized}
                  onChange={e =>
                    setNewType({ ...newType, is_serialized: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="is_serialized" className="text-sm">
                  Track individual units (serialized)
                </label>
              </div>

              <div>
                <label className="text-sm">Description</label>
                <textarea
                  value={newType.description}
                  onChange={e =>
                    setNewType({ ...newType, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateType(false)}
                  type="button"
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createTypeMutation.isPending}
                  className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Create Asset */}
      {showCreateAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-md">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">New Asset</h2>
              <button
                onClick={() => setShowCreateAsset(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">

              <div>
                <label className="text-sm">Asset Type</label>
                <select
                  value={newAsset.asset_type_id}
                  onChange={e =>
                    setNewAsset({ ...newAsset, asset_type_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:border-teal-600"
                  required
                >
                  <option value="">Select type</option>
                  {currentTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newAsset.quantity}
                  onChange={e => {
                    const qty = Number(e.target.value)
                    setNewAsset(prev => ({
                      ...prev,
                      quantity: qty,
                      serial_numbers: selectedType?.is_serialized
                        ? Array.from({ length: qty }, (_, i) => prev.serial_numbers[i] || '')
                        : [],
                    }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              {/* Serial Numbers */}
              {selectedType?.is_serialized && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Array.from({ length: newAsset.quantity }).map((_, i) => (
                    <div key={i}>
                      <label className="text-sm">Serial Number {i + 1}</label>
                      <input
                        value={newAsset.serial_numbers[i] || ''}
                        onChange={e => {
                          const updated = [...newAsset.serial_numbers]
                          updated[i] = e.target.value
                          setNewAsset(prev => ({ ...prev, serial_numbers: updated }))
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.purchase_date}
                    onChange={e =>
                      setNewAsset({ ...newAsset, purchase_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm">Purchase Price</label>
                  <input
                    type="number"
                    value={newAsset.purchase_price}
                    onChange={e =>
                      setNewAsset({ ...newAsset, purchase_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm">Location</label>
                <input
                  value={newAsset.location}
                  onChange={e =>
                    setNewAsset({ ...newAsset, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="text-sm">Notes</label>
                <textarea
                  value={newAsset.notes}
                  onChange={e =>
                    setNewAsset({ ...newAsset, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateAsset(false)}
                  type="button"
                  className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createAssetMutation.isPending}
                  className="px-4 py-2 bg-teal-700 text-white rounded-MD text-sm hover:bg-teal-800"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Assign Asset */}
      {showAssignAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-md">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                Assign Asset – {selectedAsset.asset_tag}
              </h2>
              <button
                onClick={() => {
                  setShowAssignAsset(false)
                  setSelectedAsset(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAssignAsset} className="space-y-4">

              <div>
                <label className="text-sm">Staff</label>
                <select
                  value={assignmentForm.staff_id}
                  onChange={e =>
                    setAssignmentForm({ ...assignmentForm, staff_id: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md text-sm"
                  required
                >
                  <option value="">Select staff</option>
                  {staffOptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.employee_code || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm">Assigned Date</label>
                <input
                  type="date"
                  value={assignmentForm.assigned_date}
                  onChange={e =>
                    setAssignmentForm({ ...assignmentForm, assigned_date: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm">Expected Return Date</label>
                <input
                  type="date"
                  value={assignmentForm.expected_return_date}
                  onChange={e =>
                    setAssignmentForm({ ...assignmentForm, expected_return_date: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignAsset(false)
                    setSelectedAsset(null)
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={assignAssetMutation.isPending}
                  className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800"
                >
                  Assign
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Return Asset */}
      {showReturnAsset && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-md">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                Return Asset – {selectedAsset.asset_tag}
              </h2>
              <button
                onClick={() => {
                  setShowReturnAsset(false)
                  setSelectedAsset(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleReturnAsset} className="space-y-4">

              <div>
                <label className="text-sm">Returned Date</label>
                <input
                  type="date"
                  value={returnForm.returned_date}
                  onChange={e =>
                    setReturnForm({ ...returnForm, returned_date: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm">Condition on Return</label>
                <textarea
                  value={returnForm.condition_on_return}
                  onChange={e =>
                    setReturnForm({ ...returnForm, condition_on_return: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowReturnAsset(false)
                    setSelectedAsset(null)
                  }}
                  type="button"
                  className="px-4 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={returnAssetMutation.isPending}
                  className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 text-sm"
                >
                  Return
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default AssetsPage
