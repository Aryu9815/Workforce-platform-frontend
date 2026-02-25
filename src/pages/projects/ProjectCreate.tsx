import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { showApiError } from '../../lib/utils'

const inputClass =
  "border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
const labelClass = "text-sm font-medium text-gray-700"

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

  const { data: staffNames, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      toast.success('Project created successfully')
      navigate('/projects')
    },
    onError: (error: any) => {
      showApiError(error, 'Failed to create project')
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
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
      project_manager_id: selectedManagerId || undefined,
    })
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Create Project</h1>
        <p className="text-gray-500 text-sm">
          Add a new project with required details
        </p>
      </div>

      {/* Form Container */}
      <form
        onSubmit={onSubmit}
        className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-10"
      >

        {/* SECTION: Basic Info */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Project Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Project Name */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={onChange}
                className={inputClass}
              />
            </div>

            {/* Project Code */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Project Code</label>
              <input
                name="code"
                value={form.code}
                onChange={onChange}
                className={inputClass}
              />
            </div>

            {/* Project Type */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Project Type</label>
              <input
                name="project_type"
                value={form.project_type}
                onChange={onChange}
                className={inputClass}
              />
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

        {/* SECTION: Project Manager */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Project Manager
          </h2>

          <div className="flex flex-col gap-2 relative">

            <label className={labelClass}>Assign Manager</label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

              <input
                type="text"
                value={managerSearch}
                placeholder={isLoadingStaff ? 'Loading...' : 'Search staff...'}
                onChange={(e) => setManagerSearch(e.target.value)}
                className={`${inputClass} pl-10`}
              />

              {/* Suggestions */}
              {managerSearch && !isLoadingStaff && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">

                  {staffNames
                    ?.filter(st => st.name.toLowerCase().includes(managerSearch.toLowerCase()))
                    ?.slice(0, 25)
                    ?.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedManagerId(st.id)
                          setManagerSearch(st.name)
                        }}
                        className="flex justify-between w-full px-3 py-2 hover:bg-indigo-50 text-left"
                      >
                        <span className="text-sm text-gray-800">{st.name}</span>
                      </button>
                    ))}

                  {Array.isArray(staffNames) && staffNames.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No staff found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Schedule */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={onChange}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={onChange}
                className={inputClass}
              />
            </div>

          </div>
        </div>

        {/* SECTION: Financials */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Budget
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
              <label className={labelClass}>Currency</label>
              <input
                name="currency"
                value={form.currency}
                onChange={onChange}
                className={inputClass}
              />
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-5 py-2 rounded-md border text-gray-700 bg-white hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </button>
        </div>

      </form>
    </div>
  )
}

export default ProjectCreate
