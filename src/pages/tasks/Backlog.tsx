import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, ArrowLeft } from 'lucide-react'
import { tasksApi } from '../../api/tasks'

const Backlog = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const { data, isLoading } = useQuery({
    queryKey: ['backlog', id, page, search],
    queryFn: () => tasksApi.getBacklogTasks({
      project_id: id,
      page,
      page_size: pageSize,
    }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div>
            <h1 className="page-title">Backlog</h1>
            <p className="page-description">Unplanned tasks not assigned to a sprint</p>
          </div>
        </div>
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              className="input pl-10"
              placeholder="Search title or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Title</th>
              <th className="table-header-cell">Priority</th>
              <th className="table-header-cell">Type</th>
              <th className="table-header-cell">Workflow State</th>
              <th className="table-header-cell">Assignees</th>
              <th className="table-header-cell">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8">Loading...</td>
              </tr>
            ) : (data?.items || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">No backlog tasks</td>
              </tr>
            ) : (
              data?.items.map((t: any) => (
                <tr key={t.id} className="hover:bg-secondary-50">
                  <td className="table-cell">
                    <div className="font-medium">{t.title}</div>
                    {t.description && <div className="text-sm text-secondary-500 line-clamp-1">{t.description}</div>}
                  </td>
                  <td className="table-cell">{t.priority || '—'}</td>
                  <td className="table-cell">{t.task_type || '—'}</td>
                  <td className="table-cell">{t.workflow_state_name || t.workflow_state_id || '—'}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(t.assignees || []).map((a: any) => (
                        <span key={a.assignee_id || a.id} className="px-2 py-0.5 rounded bg-secondary-100 text-secondary-800 text-xs">
                          {a.name || a.full_name || a.assignee_id}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">{t.due_date || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(data?.total_pages || 0) > 1 && (
        <div className="flex justify-end items-center gap-2">
          <button className="btn-default" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <div className="text-sm">{page} / {data?.total_pages}</div>
          <button className="btn-default" disabled={page >= (data?.total_pages || 1)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}

export default Backlog
