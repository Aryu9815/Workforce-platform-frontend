import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import { Search } from 'lucide-react'

const ProjectCreate = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    project_type: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD',
  })
  const [managerSearch, setManagerSearch] = useState('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  const { data: staffNames, isLoading: isLoadingStaffNames } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      navigate('/projects')
    },
  })

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createMutation.mutate({
      name: form.name,
      code: form.code || undefined,
      description: form.description || undefined,
      status: form.status as any,
      priority: form.priority as any,
      project_type: form.project_type || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      currency: form.currency || 'USD',
      project_manager_id: selectedManagerId || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Add Project</h1>
        <p className="page-description">Create a new project</p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Project Name"
            value={form.name}
            onChange={onChange}
            required
            className="input"
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Project Manager
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400 pointer-events-none" />
              <input
                type="text"
                placeholder={isLoadingStaffNames ? 'Loading staff...' : 'Search staff by name'}
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="input pl-10"
                disabled={isLoadingStaffNames}
              />
              {/* Dropdown container for staff list */}
              {managerSearch && !isLoadingStaffNames && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {Array.isArray(staffNames) && staffNames.length > 0 ? (
                    staffNames
                      .filter((staff) =>
                        staff.name.toLowerCase().includes(managerSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            setSelectedManagerId(staff.id)
                            setManagerSearch(staff.name)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-secondary-100 focus:outline-none focus:bg-secondary-100 ${
                            selectedManagerId === staff.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <span className="text-sm text-secondary-900">
                            {staff.name}
                          </span>
                          <span className="ml-2 text-xs text-secondary-500">
                            {staff.id}
                          </span>
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

          <input
            name="code"
            placeholder="Project Code"
            value={form.code}
            onChange={onChange}
            className="input"
          />

          <div className="md:col-span-2">
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={onChange}
              rows={4}
              className="input"
            />
          </div>

          <select
            name="status"
            value={form.status}
            onChange={onChange}
            className="input"
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          <select
            name="priority"
            value={form.priority}
            onChange={onChange}
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input
            name="project_type"
            placeholder="Project Type"
            value={form.project_type}
            onChange={onChange}
            className="input"
          />

          <input
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={onChange}
            className="input"
          />

          <input
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={onChange}
            className="input"
          />

          <input
            name="budget"
            type="number"
            step="0.01"
            placeholder="Budget"
            value={form.budget}
            onChange={onChange}
            className="input"
          />

          <input
            name="currency"
            placeholder="Currency"
            value={form.currency}
            onChange={onChange}
            className="input"
          />
        </div>

        <div className="card-footer flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectCreate
