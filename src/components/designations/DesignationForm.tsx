import { useState, useEffect } from 'react'
import { Designation, Department } from '../../types'

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
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'level' 
          ? parseInt(value) || 0 
          : value,
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
          <label className="label">Designation Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Senior Software Engineer"
            value={form.name}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Level</label>
            <input
              type="number"
              name="level"
              placeholder="e.g. 1"
              value={form.level}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Department</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Brief description of the role"
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
          {loading ? 'Saving...' : isEdit ? 'Update Designation' : 'Create Designation'}
        </button>
      </div>
    </form>
  )
}

export default DesignationForm
