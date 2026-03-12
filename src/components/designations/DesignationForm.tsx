import { useEffect, useState } from 'react'
import { Designation, Department } from '../../types'
import toast from 'react-hot-toast'

interface DesignationFormProps {
  defaultValues?: Partial<Designation>
  onSubmit: (data: any) => void
  isEdit?: boolean
  loading?: boolean
  departments: Department[]
}

const DesignationForm = ({
  defaultValues,
  onSubmit,
  isEdit = false,
  loading = false,
  departments,
}: DesignationFormProps) => {

  const [form, setForm] = useState({
    name: '',
    level: 0,
    department_id: '',
    description: '',
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        ...defaultValues,
        department_id: defaultValues.department_id || '',
      }))
    }
  }, [defaultValues])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'level'
            ? parseInt(value) || 0
            : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Designation name is required'
    if (!form.department_id) newErrors.department_id = 'Department is required'
    if (form.description && form.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 max-w-3xl bg-white p-8 rounded-md border border-gray-200 shadow-sm"
    >

      {/* HEADER */}
      <div>
        <h2 className={sectionTitle}>Designation Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Designation Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="e.g. Senior Software Engineer"
              value={form.name}
              onChange={handleChange}
              className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          {/* Level */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Level</label>
            <input
              type="number"
              name="level"
              placeholder="e.g. 1"
              value={form.level}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Department */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className={`${inputClass} ${errors.department_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department_id && <p className="error-message">{errors.department_id}</p>}
          </div>

        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <h2 className={sectionTitle}>Description</h2>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Role Description</label>
          <textarea
            name="description"
            rows={4}
            placeholder="Brief description of the role"
            value={form.description}
            onChange={handleChange}
            className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>
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
          Active Designation
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
          className="btn-primary"
          disabled={loading}
        >
          {loading
            ? 'Saving...'
            : isEdit
            ? 'Update Designation'
            : 'Create Designation'}
        </button>
      </div>

    </form>
  )
}

export default DesignationForm
