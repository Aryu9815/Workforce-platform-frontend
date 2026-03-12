import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { staffApi } from '../../api/staff'
import { Department } from '../../types'
import toast from 'react-hot-toast'

interface DepartmentFormProps {
  defaultValues?: Partial<Department>
  onSubmit: (data: any) => void
  isEdit?: boolean
  loading?: boolean
}

const DepartmentForm = ({
  defaultValues,
  onSubmit,
  isEdit = false,
  loading = false,
}: DepartmentFormProps) => {

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    head_id: '',
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        ...defaultValues,
        head_id: defaultValues.head_id || '',
      }))
    }
  }, [defaultValues])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Department name is required'
    else if (form.name.length > 100) newErrors.name = 'Name must be less than 100 characters'
    if (!form.code.trim()) newErrors.code = 'Department code is required'
    else if (form.code && form.code.length > 20) newErrors.code = 'Code must be less than 20 characters'
    if (form.description && form.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (!form.head_id.trim()) newErrors.head_id = 'Department head is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    onSubmit(form)
  }

  const inputClass = "input"
  const labelClass = "label"
  const sectionTitle = "section-title mb-4"

  const { data: staffListData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff', 'all-for-department-head'],
    queryFn: () =>
      staffApi.getStaffList({
        page: 1,
        page_size: 100,
      }),
  })

  const staffOptions =
    staffListData?.items?.map((s: any) => ({ id: s.id, name: s.full_name })) || []

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 max-w-3xl bg-white p-8 rounded-md border border-gray-200 shadow-sm"
    >

      {/* HEADER */}
      <div>
        <h2 className={sectionTitle}>Department Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Department Name */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g. Engineering"
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          {/* Department Code */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
            Department Code <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className={`${inputClass} ${errors.code ? 'border-red-500' : ''}`}
              placeholder="e.g. ENG"
            />
            {errors.code && <p className="error-message">{errors.code}</p>}
          </div>

        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <h2 className={sectionTitle}>Description</h2>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>About Department</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Brief department description..."
            className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>
      </div>

      {/* DEPARTMENT HEAD */}
      <div>
        <h2 className={sectionTitle}>
          Department Head <span className="text-red-500">*</span>
        </h2>
        <div className="flex flex-col gap-2">
          <select
            name="head_id"
            value={form.head_id || ''}
            onChange={handleChange}
            disabled={staffLoading}
            className={inputClass}
          >
            <option value="">None</option>
            {staffOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        {errors.head_id && <p className="error-message">{errors.head_id}</p>}
      </div>

      {/* ACTIVE STATUS */}
      <div className="pt-4 border-t border-gray-200">
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
          />
          Active Department
        </label>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Department"
            : "Create Department"}
        </button>
      </div>

    </form>
  )
}

export default DepartmentForm
