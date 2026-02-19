import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import toast from 'react-hot-toast'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(id!),
    onSuccess: () => {
      toast.success('Project deleted')
      navigate('/projects')
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete project'
      )
    },
  })

  if (isLoading) return <div className="py-10 text-center text-gray-500">Loading...</div>
  if (!project) return <div className="py-10 text-center text-gray-500">Project not found</div>

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const calculateDuration = () => {
    if (!project.start_date || !project.end_date) return '—'
    const start = new Date(project.start_date)
    const end = new Date(project.end_date)
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return `${diff} days`
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            {getStatusBadge(project.status)}
          </div>
          {project.code && (
            <p className="text-sm text-gray-500">Project Code: {project.code}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
          >
            Back
          </button>

          <button
            onClick={() => navigate(`/projects/${id}/workflow`)}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
          >
            My Task
          </button>

          <button
            onClick={() => navigate(`/projects/${id}/edit`)}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
          >
            Edit
          </button>

          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: OVERVIEW */}
        <div className="lg:col-span-2 space-y-6">

          {/* Overview Card */}
          <div className="border bg-white rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

            <p className="text-gray-700 leading-relaxed">
              {project.description || 'No description provided.'}
            </p>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {project.progress_percentage}%
                </span>
              </div>

              <div className="h-4 bg-gray-200 rounded-full">
                <div
                  className="h-4 bg-teal-700 rounded-full"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="p-3 rounded bg-gray-50 border">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {project.status.replace('_', ' ')}
                </p>
              </div>

              <div className="p-3 rounded bg-gray-50 border">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                </p>
              </div>

              <div className="p-3 rounded bg-gray-50 border">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900">{calculateDuration()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="space-y-6">

          <div className="border bg-white rounded-lg p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>

            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-500">Project Manager</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.manager_name || 'Not assigned'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.budget
                    ? `$${project.budget.toLocaleString()}`
                    : 'Not set'}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH TEAM MEMBERS */}
      <div className="border bg-white rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/projects/${id}/members/new`)}
              className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
            >
              Add Member
            </button>

            <button
              onClick={() => navigate(`/projects/${id}/members`)}
              className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 text-sm"
            >
              View All
            </button>
          </div>
        </div>

        {project.project_members?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.project_members.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate(`/staff/${member.staff_id}`)}
                className="p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
              >
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-600">{member.role}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No team members added yet.
          </p>
        )}
      </div>

    </div>
  )
}

export default ProjectDetail
