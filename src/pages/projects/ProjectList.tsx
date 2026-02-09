import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { projectsApi } from '../../api/projects'
import { Project } from '../../types'

const ProjectList = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, statusFilter],
    queryFn: () => projectsApi.getProjects({
      page,
      page_size: 20,
      search: search || undefined,
      status: statusFilter || undefined,
    }),
  })
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'badge-default',
      active: 'badge-success',
      on_hold: 'badge-warning',
      completed: 'badge-info',
    }
    return <span className={styles[status] || 'badge-default'}>{status.replace('_', ' ')}</span>
  }
  
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'badge-default',
      medium: 'badge-info',
      high: 'badge-warning',
      critical: 'badge-danger',
    }
    return <span className={styles[priority] || 'badge-default'}>{priority}</span>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">Manage your organization's projects</p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input pl-10 appearance-none"
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
      </div>
      
      {/* Projects table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Project</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Priority</th>
              <th className="table-header-cell">Progress</th>
              <th className="table-header-cell">Budget</th>
              <th className="table-header-cell">Timeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8">Loading...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">
                  No projects found
                </td>
              </tr>
            ) : (
              data?.items.map((project: Project) => (
                <tr key={project.id} className="table-row cursor-pointer hover:bg-secondary-50">
                  <td className="table-cell">
                    <Link to={`/projects/${project.id}`}>
                      <p className="text-sm font-medium text-secondary-900">{project.name}</p>
                      {project.code && (
                        <p className="text-xs text-secondary-500">{project.code}</p>
                      )}
                    </Link>
                  </td>
                  <td className="table-cell">{getStatusBadge(project.status)}</td>
                  <td className="table-cell">{getPriorityBadge(project.priority)}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-secondary-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-primary-600 rounded-full"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-secondary-600">{project.progress_percentage}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {project.budget ? (
                      <span className="text-sm text-secondary-700">
                        ${project.budget.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-secondary-600">
                      {project.start_date ? (
                        <>
                          {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </div>
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
          <p className="text-sm text-secondary-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} results
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-600">Page {page} of {data.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
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
