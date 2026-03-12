import { useState, useEffect } from 'react'
import { TaskLabel, TaskLabelUpdate } from '../../types'

interface TaskLabelFormProps {
  initialData?: TaskLabel | null
  onSubmit: (data: TaskLabelUpdate) => void
  onCancel: () => void
  isSubmitting: boolean
}

const TaskLabelForm = ({ initialData, onSubmit, onCancel, isSubmitting }: TaskLabelFormProps) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    color: '#CCCCCC',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label || '',
        description: initialData.description || '',
        color: initialData.color || '#CCCCCC',
      })
    } else {
      setFormData({
        label: '',
        description: '',
        color: '#CCCCCC',
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="label" className="label">
          Label Name
        </label>
        <input
          type="text"
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="input"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="color" className="label">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10 w-10 p-1 border border-secondary-300 rounded-sm cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="input max-w-xs"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default TaskLabelForm