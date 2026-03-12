import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import toast from 'react-hot-toast'
import { ArrowLeft, Search } from 'lucide-react'
import { showApiError } from '../../lib/utils'

const inputClass = "input"
const labelClass = "label"

const ProjectEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })

  const { data: staffNames, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  // Normalize staff options
  const staffOptions =
    Array.isArray(staffNames)
      ? staffNames
      : staffNames
      ? Object.entries(staffNames).map(([id, name]) => ({ id, name }))
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
  const [selectedManagerId, setSelectedManagerId] = useState('')

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
        progress_percentage:
          project.progress_percentage != null ? String(project.progress_percentage) : '',
      })

      setSelectedManagerId(project.project_manager_id || '')
      setManagerSearch(project.manager_name || '')
    }
  }, [project])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => projectsApi.updateProject(id!, payload),
    onSuccess: () => {
      toast.success('Project updated successfully')
      navigate(`/projects/${id}`)
    },
    onError: (error: any) => {
      showApiError(error, 'Failed to update project')
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
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Edit Project</h1>
          <p className="text-gray-500 text-sm">
            Update project details and timeline
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoadingProject ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-10"
        >

          {/* SECTION: Basic Info */}
          <div>
            <h2 className="section-title mb-4">
              Project Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Project Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className={inputClass}
                >
                  <option value="">Select Status</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={onChange}
                  className={inputClass}
                >
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2 mt-6">
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={4}
                className={inputClass}
              />
            </div>
          </div>

          {/* SECTION: Manager */}
          <div>
            <h2 className="section-title mb-4">
              Project Manager
            </h2>

            <div className="flex flex-col gap-2 relative">
              <label className={labelClass}>Assign Manager</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

                <input
                  type="text"
                  value={managerSearch}
                  onChange={e => setManagerSearch(e.target.value)}
                  placeholder={isLoadingStaff ? "Loading..." : "Search staff..."}
                  className={`${inputClass} pl-10`}
                />

                {/* Suggestions */}
                {managerSearch && (
                  <div className="absolute z-20 bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-56 overflow-y-auto w-full">

                    {staffOptions
                      .filter(st => st.name.toLowerCase().includes(managerSearch.toLowerCase()))
                      .slice(0, 30)
                      .map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedManagerId(st.id)
                            setManagerSearch(st.name)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-indigo-50 ${
                            selectedManagerId === st.id ? "bg-indigo-100" : ""
                          }`}
                        >
                          <span className="text-sm text-gray-800">{st.name}</span>
                        </button>
                      ))}

                    {staffOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No staff found</div>
                    )}

                  </div>
                )}
              </div>

              {selectedManagerId && (
                <p className="text-xs text-gray-500">
                  Selected Manager ID: {selectedManagerId}
                </p>
              )}
            </div>
          </div>

          {/* SECTION: Timeline */}
          <div>
            <h2 className="section-title mb-4">
              Timeline
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Planned Start</label>
                <input
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Planned End</label>
                <input
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Actual Start</label>
                <input
                  name="actual_start_date"
                  type="date"
                  value={form.actual_start_date}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Actual End</label>
                <input
                  name="actual_end_date"
                  type="date"
                  value={form.actual_end_date}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

            </div>
          </div>

          {/* SECTION: Budget */}
          <div>
            <h2 className="section-title mb-4">
              Budget & Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Budget</label>
                <input
                  type="number"
                  step="0.01"
                  name="budget"
                  value={form.budget}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Cost Estimate</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost_estimate"
                  value={form.cost_estimate}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Progress (%)</label>
                <input
                  type="number"
                  name="progress_percentage"
                  min={0}
                  max={100}
                  value={form.progress_percentage}
                  onChange={onChange}
                  className={inputClass}
                />
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
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
              {updateMutation.isPending ? "Updating..." : "Update Project"}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}

export default ProjectEdit
