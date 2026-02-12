import { useState, useEffect } from 'react'
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <label className="label">Department Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Engineering"
            value={form.name}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Department Code</label>
          <input
            name="code"
            placeholder="e.g. ENG"
            value={form.code}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Brief description of the department"
            value={form.description}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-secondary-900">
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
        </button>
      </div>
    </form>
  )
}

export default DepartmentForm
