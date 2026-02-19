import { useEffect, useState } from 'react'
import { Department } from '../../types'

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
    is_active: true,
  })

  useEffect(() => {
    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        ...defaultValues,
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
    onSubmit(form)
  }

  const inputClass =
    "border border-gray-300 rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"

  const labelClass = "text-sm font-medium text-gray-700"

  const sectionTitle =
    "text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4"

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
              required
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Engineering"
            />
          </div>

          {/* Department Code */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Department Code</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. ENG"
            />
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
            className={inputClass + " resize-none"}
          />
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
          Active Department
        </label>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition disabled:opacity-60"
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
