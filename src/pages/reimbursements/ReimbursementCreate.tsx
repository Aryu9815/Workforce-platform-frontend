import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { reimbursementsApi, CreateReimbursementItemData } from '../../api/reimbursements'
import { staffApi } from '../../api/staff'
import type { ExpenseCategory, Staff } from '../../types'
import { ArrowLeft, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../lib/utils'

type ItemForm = {
  category_id: string
  expense_date: string
  description: string
  amount: string
  quantity: string
  unit_price: string
  tax_amount: string
  merchant_name: string
  merchant_location: string
}

const emptyItem: ItemForm = {
  category_id: '',
  expense_date: '',
  description: '',
  amount: '',
  quantity: '1',
  unit_price: '',
  tax_amount: '0',
  merchant_name: '',
  merchant_location: '',
}

const ReimbursementCreate = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    staff_id: '',
    staff_search: '',
    claim_date: new Date().toISOString().split('T')[0],
    expense_date_start: '',
    expense_date_end: '',
    currency: 'INR',
    description: '',
  })

  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categories } = useQuery<ExpenseCategory[]>({
    queryKey: ['reimbursement-categories'],
    queryFn: reimbursementsApi.getCategories,
  })

  const { data: staffList } = useQuery({
    queryKey: ['staff-list-for-reimbursements'],
    queryFn: () =>
      staffApi.getStaffList({
        page: 1,
        page_size: 100,
      }),
  })

  const createMutation = useMutation({
    mutationFn: reimbursementsApi.createClaim,
    onSuccess: (created) => {
      toast.success('Reimbursement claim created')
      navigate(`/reimbursements/${created.id}`)
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create reimbursement claim'))
    },
  })

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onStaffSearchChange = (value: string) => {
    setForm(prev => ({ ...prev, staff_search: value }))
    setIsStaffDropdownOpen(!!value)
  }

  const onItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [name]: value }
      return next
    })
  }

  const addItemRow = () => {
    setItems(prev => [...prev, { ...emptyItem }])
  }

  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const buildItemsPayload = (): CreateReimbursementItemData[] => {
    return items
      .filter(item => item.category_id && item.amount)
      .map(item => ({
        category_id: item.category_id,
        expense_date: item.expense_date || form.claim_date,
        description: item.description || 'Expense',
        amount: Number(item.amount),
        quantity: item.quantity ? Number(item.quantity) : undefined,
        unit_price: item.unit_price ? Number(item.unit_price) : undefined,
        tax_amount: item.tax_amount ? Number(item.tax_amount) : undefined,
        merchant_name: item.merchant_name || undefined,
        merchant_location: item.merchant_location || undefined,
      }))
  }

  const computeTotalAmount = () => {
    const parsed = buildItemsPayload()
    if (!parsed.length) {
      return 0
    }
    return parsed.reduce((sum, item) => sum + item.amount, 0)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}

    if (!form.staff_id) {
      newErrors.staff_id = 'Staff selection is required'
    }

    if (!form.claim_date) {
      newErrors.claim_date = 'Claim date is required'
    }

    const payloadItems = buildItemsPayload()

    if (payloadItems.length === 0) {
      newErrors.items = 'At least one valid expense item is required'
    }

    // Deep validation for items
    items.forEach((item, index) => {
      if (!item.category_id) {
        newErrors[`item_${index}_category_id`] = 'Category is required'
      }
      if (!item.expense_date) {
        newErrors[`item_${index}_expense_date`] = 'Expense date is required'
      }
      if (!item.description || item.description.trim() === '') {
        newErrors[`item_${index}_description`] = 'Description is required'
      } else if (item.description.length > 500) {
        newErrors[`item_${index}_description`] = 'Description must be less than 500 characters'
      }
      if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
        newErrors[`item_${index}_amount`] = 'Amount must be greater than 0'
      }
      if (item.quantity && (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.tax_amount && (isNaN(Number(item.tax_amount)) || Number(item.tax_amount) < 0)) {
        newErrors[`item_${index}_tax_amount`] = 'Tax amount cannot be negative'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    createMutation.mutate({
      staff_id: form.staff_id,
      claim_date: form.claim_date,
      expense_date_start: form.expense_date_start || undefined,
      expense_date_end: form.expense_date_end || undefined,
      currency: form.currency || 'INR',
      description: form.description || undefined,
      total_amount: computeTotalAmount(),
      items: payloadItems,
    })
  }

  const totalAmount = computeTotalAmount()
  
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/reimbursements')}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <h1 className="page-title">New Reimbursement Claim</h1>
          <p className="page-description">
            Create a new reimbursement claim with one or more expense items
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Staff
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search staff by name or code"
                  value={form.staff_search}
                  onChange={(e) => onStaffSearchChange(e.target.value)}
                  className={`input pl-10 ${errors.staff_id ? 'border-red-500' : ''}`}
                />
                {errors.staff_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.staff_id}</p>
                )}
                {isStaffDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {staffList?.items && staffList.items.length > 0 ? (
                      staffList.items
                        .filter((staff: Staff) => {
                          const query = form.staff_search.toLowerCase()
                          return (
                            staff.full_name.toLowerCase().includes(query) ||
                            (staff.employee_code || '').toLowerCase().includes(query)
                          )
                        })
                        .slice(0, 50)
                        .map((staff: Staff) => (
                          <button
                            key={staff.id}
                            type="button"
                          onClick={() => {
                            setSelectedStaff(staff)
                            setForm(prev => ({
                              ...prev,
                              staff_id: staff.id,
                              staff_search: staff.full_name,
                            }))
                            setIsStaffDropdownOpen(false)
                          }}
                            className={`w-full text-left px-3 py-2 hover:bg-secondary-100 focus:outline-none focus:bg-secondary-100 ${
                              selectedStaff?.id === staff.id ? 'bg-primary-50' : ''
                            }`}
                          >
                            <span className="text-sm text-secondary-900">
                              {staff.full_name}
                            </span>
                            {staff.employee_code && (
                              <span className="ml-2 text-xs text-secondary-500">
                                {staff.employee_code}
                              </span>
                            )}
                          </button>
                        ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-secondary-500">
                        No staff found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Claim date
              </label>
              <input
                type="date"
                name="claim_date"
                value={form.claim_date}
                onChange={onChange}
                className={`input ${errors.claim_date ? 'border-red-500' : ''}`}
              />
              {errors.claim_date && (
                <p className="mt-1 text-xs text-red-500">{errors.claim_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={onChange}
                className="input"
              >
                {/* <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option> */}
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Expense start date
              </label>
              <input
                type="date"
                name="expense_date_start"
                value={form.expense_date_start}
                onChange={onChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Expense end date
              </label>
              <input
                type="date"
                name="expense_date_end"
                value={form.expense_date_end}
                onChange={onChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Claim description
            </label>
            <textarea
              name="description"
              placeholder="Describe the purpose of this claim"
              value={form.description}
              onChange={onChange}
              rows={3}
              className="input"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-secondary-700">
                Expense items
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="btn-secondary"
              >
                Add item
              </button>
            </div>
            {errors.items && (
              <p className="text-sm text-red-500">{errors.items}</p>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-md p-3 ${
                    Object.keys(errors).some(k => k.startsWith(`item_${index}_`))
                      ? 'border-red-300 bg-red-50'
                      : 'border-secondary-200'
                  }`}
                >
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={item.category_id}
                      onChange={(e) => onItemChange(index, e)}
                      className={`input ${errors[`item_${index}_category_id`] ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select category</option>
                      {categories?.map((cat: ExpenseCategory) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors[`item_${index}_category_id`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_category_id`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Expense date
                    </label>
                    <input
                      type="date"
                      name="expense_date"
                      value={item.expense_date}
                      onChange={(e) => onItemChange(index, e)}
                      className={`input ${errors[`item_${index}_expense_date`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`item_${index}_expense_date`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_expense_date`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => onItemChange(index, e)}
                      className={`input ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`item_${index}_description`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_description`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => onItemChange(index, e)}
                      className={`input ${errors[`item_${index}_amount`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`item_${index}_amount`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_amount`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, e)}
                      className={`input ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                      Tax
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="tax_amount"
                        placeholder="Tax"
                        value={item.tax_amount}
                        onChange={(e) => onItemChange(index, e)}
                        className={`input ${errors[`item_${index}_tax_amount`] ? 'border-red-500' : ''}`}
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="btn-secondary"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {errors[`item_${index}_tax_amount`] && (
                      <p className="mt-1 text-[10px] text-red-500">{errors[`item_${index}_tax_amount`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
            <p className="text-sm text-secondary-700">
              Total amount:{' '}
              <span className="font-semibold">
                {totalAmount.toFixed(2)} {form.currency}
              </span>
            </p>
          </div>
        </div>

        <div className="card-footer flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/reimbursements')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Claim'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReimbursementCreate
