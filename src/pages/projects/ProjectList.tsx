import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { projectsApi } from '../../api/projects'
import { useAuthStore } from '../../store/authStore'
import { Project } from '../../types'

const ProjectList = () => {
  const getPermissions = useAuthStore(state => state.getPermissions)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, statusFilter],
    queryFn: () =>
      projectsApi.getProjects({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter || undefined
      })
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'text-gray-700 bg-gray-100',
      active: 'text-green-700 bg-green-100',
      on_hold: 'text-yellow-700 bg-yellow-100',
      completed: 'text-blue-700 bg-blue-100'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'text-gray-700 bg-gray-100',
      medium: 'text-blue-700 bg-blue-100',
      high: 'text-yellow-700 bg-yellow-100',
      critical: 'text-red-700 bg-red-100'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-700'}`}>
        {priority}
      </span>
    )
  }

  const canViewProjects = getPermissions('project:view')
  const canCreateProjects = getPermissions('project:create')

  if (!canViewProjects) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view projects.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">Manage your organization's projects</p>
        </div>

        {canCreateProjects && (
          <Link
            to="/projects/new"
            className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm transition"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-md p-4 bg-white">
        <div className="flex flex-wrap gap-6">

          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-2 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <div className="relative">
              <Filter className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-6 pr-2 py-2 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm outline-none appearance-none"
              >
                <option value="">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Project</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Priority</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Progress</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Budget</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Timeline</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No projects found
                </td>
              </tr>
            ) : (
              data?.items.map((project: Project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition cursor-pointer">
                  <td className="px-6 py-4">
                    <Link to={`/projects/${project.id}`}>
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      {project.code && <p className="text-xs text-gray-500">{project.code}</p>}
                    </Link>
                  </td>

                  <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                  <td className="px-6 py-4">{getPriorityBadge(project.priority)}</td>

                  {/* Progress bar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-teal-600 rounded-full"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {project.progress_percentage}%
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {project.budget ? (
                      <span className="text-sm text-gray-700">
                        ${project.budget.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {project.start_date ? (
                      <>
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {project.end_date
                          ? new Date(project.end_date).toLocaleDateString()
                          : 'TBD'}
                      </>
                    ) : (
                      'Not scheduled'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} results
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">Page {page} of {data.pages}</span>

            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectList
