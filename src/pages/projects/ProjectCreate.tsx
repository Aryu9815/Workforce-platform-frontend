import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import toast from 'react-hot-toast'
import { ArrowLeft, Search } from 'lucide-react'
import { showApiError } from '../../lib/utils'

const inputClass = "input"
const labelClass = "label"

const ProjectCreate = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on_hold' | 'completed',
    priority: 'medium' as 'medium' | 'low' | 'high' | 'critical',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD',
  })

  const [managerSearch, setManagerSearch] = useState('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: staffNames, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  const staffOptions =
    Array.isArray(staffNames)
      ? staffNames
      : staffNames
      ? Object.entries(staffNames).map(([id, name]) => ({ id, name: name as string }))
      : []

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
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = 'Project name is required'
    if (!form.code.trim()) newErrors.code = 'Project code is required'
    if (!form.start_date) newErrors.start_date = 'Start date is required'
    if (!form.end_date) newErrors.end_date = 'End date is required'
    if (!selectedManagerId) newErrors.manager = 'Project manager is required'
    if (form.budget && Number(form.budget) <= 0) {
      newErrors.budget = 'Budget must be a positive number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    createMutation.mutate({
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
      project_manager_id: selectedManagerId,
    })
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create Project</h1>
          <p className="text-gray-500 text-sm">
            Add a new project with required details
          </p>
        </div>
      </div>

      {/* Form Container */}
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

            {/* Project Name */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="error-message">{errors.name}</p>}
            </div>

            {/* Project Code */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Project Code <span className="text-red-500">*</span></label>
              <input
                name="code"
                value={form.code}
                onChange={onChange}
                className={`${inputClass} ${errors.code ? 'border-red-500' : ''}`}
              />
              {errors.code && <p className="error-message">{errors.code}</p>}
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
          <h2 className="section-title mb-4">
            Project Manager
          </h2>

          <div className="flex flex-col gap-2 relative">

            <label className={labelClass}>Assign Manager <span className="text-red-500">*</span></label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

              <input
                type="text"
                value={managerSearch}
                placeholder={isLoadingStaff ? 'Loading...' : 'Search staff...'}
                onChange={(e) => setManagerSearch(e.target.value)}
                className={`${inputClass} pl-10 w-full ${errors.manager ? 'border-red-500' : ''}`}
              />
              {errors.manager && <p className="error-message">{errors.manager}</p>}

              {/* Suggestions */}
              {managerSearch && !isLoadingStaff && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">

                  {staffOptions
                    .filter(st => st.name.toLowerCase().includes(managerSearch.toLowerCase()))
                    .slice(0, 25)
                    .map(st => (
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

                  {staffOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No staff found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: Schedule */}
        <div>
          <h2 className="section-title mb-4">
            Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={onChange}
                className={`${inputClass} ${errors.start_date ? 'border-red-500' : ''}`}
              />
              {errors.start_date && <p className="error-message">{errors.start_date}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={onChange}
                className={`${inputClass} ${errors.end_date ? 'border-red-500' : ''}`}
              />
              {errors.end_date && <p className="error-message">{errors.end_date}</p>}
            </div>

          </div>
        </div>

        {/* SECTION: Financials */}
        <div>
          <h2 className="section-title mb-4">
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
                className={`${inputClass} ${errors.budget ? 'border-red-500' : ''}`}
              />
              {errors.budget && <p className="error-message">{errors.budget}</p>}
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
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </button>
        </div>

      </form>
    </div>
  )
}

export default ProjectCreate
