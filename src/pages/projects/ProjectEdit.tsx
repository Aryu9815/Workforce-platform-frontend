import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'

const ProjectEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })

  const { data: staffNames, isLoading: isLoadingStaffNames } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  const staffOptions =
    Array.isArray(staffNames)
      ? staffNames.map((s: any) => ({ id: s.id, name: s.name }))
      : staffNames
      ? Object.entries(staffNames).map(([sid, name]) => ({ id: sid, name: String(name) }))
      : []

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: '',
    priority: '',
    start_date: '',
    end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    budget: '',
    cost_estimate: '',
    progress_percentage: '',
  })
  const [managerSearch, setManagerSearch] = useState('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || '',
        priority: project.priority || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        actual_start_date: project.actual_start_date || '',
        actual_end_date: project.actual_end_date || '',
        budget: project.budget != null ? String(project.budget) : '',
        cost_estimate: project.cost_estimate != null ? String(project.cost_estimate) : '',
        progress_percentage: project.progress_percentage != null ? String(project.progress_percentage) : '',
      })
      setSelectedManagerId(project.project_manager_id || '')
      setManagerSearch(project.manager_name || '')
    }
  }, [project])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => projectsApi.updateProject(id!, payload),
    onSuccess: () => {
      toast.success('Project updated')
      navigate(`/projects/${id}`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update project'
      toast.error(message)
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
    const payload = {
      name: form.name || undefined,
      description: form.description || undefined,
      status: form.status || undefined,
      priority: form.priority || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      actual_start_date: form.actual_start_date || undefined,
      actual_end_date: form.actual_end_date || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      cost_estimate: form.cost_estimate ? Number(form.cost_estimate) : undefined,
      progress_percentage: form.progress_percentage ? Number(form.progress_percentage) : undefined,
      project_manager_id: selectedManagerId || undefined,
    }
    updateMutation.mutate(payload)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Edit Project</h1>
          <p className="page-description">Update project details</p>
        </div>
      </div>

      {isLoadingProject ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <form onSubmit={onSubmit} className="card">
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Project Name"
              value={form.name}
              onChange={onChange}
              className="input"
            />

            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="input"
            >
              <option value="">Select Status</option>
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
              <option value="">Select Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

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

            <input
              name="start_date"
              type="date"
              value={form.start_date || ''}
              onChange={onChange}
              className="input"
            />

            <input
              name="end_date"
              type="date"
              value={form.end_date || ''}
              onChange={onChange}
              className="input"
            />

            <input
              name="actual_start_date"
              type="date"
              value={form.actual_start_date || ''}
              onChange={onChange}
              className="input"
            />

            <input
              name="actual_end_date"
              type="date"
              value={form.actual_end_date || ''}
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
              name="cost_estimate"
              type="number"
              step="0.01"
              placeholder="Cost Estimate"
              value={form.cost_estimate}
              onChange={onChange}
              className="input"
            />

            <input
              name="progress_percentage"
              type="number"
              min={0}
              max={100}
              placeholder="Progress %"
              value={form.progress_percentage}
              onChange={onChange}
              className="input"
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Project Manager
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder={isLoadingStaffNames ? 'Loading staff...' : 'Search staff by name'}
                  value={managerSearch}
                  onChange={(e) => setManagerSearch(e.target.value)}
                  className="input pl-10"
                  disabled={isLoadingStaffNames}
                />
                {staffOptions && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-secondary-200 bg-white">
                    {staffOptions
                      .filter(({ name }) =>
                        managerSearch ? name.toLowerCase().includes(managerSearch.toLowerCase()) : true
                      )
                      .slice(0, 50)
                      .map(({ id: sid, name }) => (
                        <button
                          key={sid}
                          type="button"
                          onClick={() => {
                            setSelectedManagerId(sid)
                            setManagerSearch(name)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-secondary-100 ${
                            selectedManagerId === sid ? 'bg-primary-50' : ''
                          }`}
                        >
                          <span className="text-sm text-secondary-900">{name}</span>
                          <span className="ml-2 text-xs text-secondary-500">{sid}</span>
                        </button>
                      ))}
                    {staffOptions && staffOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-secondary-500">No staff found</div>
                    )}
                  </div>
                )}
                {selectedManagerId && (
                  <p className="mt-2 text-xs text-secondary-600">Selected ID: {selectedManagerId}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card-footer flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ProjectEdit
