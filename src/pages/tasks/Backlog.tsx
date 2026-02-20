import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowLeft } from 'lucide-react'
import { tasksApi } from '../../api/tasks'

const Backlog = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const { data, isLoading } = useQuery({
    queryKey: ['backlog', id, page, search],
    queryFn: () =>
      tasksApi.getBacklogTasks({
        project_id: id,
        page,
        page_size: pageSize,
      }),
  })

  return (
    <div className="p-6 space-y-8 bg-gray-50 rounded-xl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 flex items-center text-sm border rounded-md bg-white hover:bg-gray-100 text-gray-700"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">Backlog</h1>
            <p className="text-sm text-gray-500">
              Unplanned tasks not assigned to a sprint
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              placeholder="Search title or description..."
              className="w-full px-3 py-2 pl-10 border-b border-gray-300 focus:border-teal-600 outline-none bg-white rounded-md text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Title</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Priority</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Type</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Workflow State</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Assignees</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Due</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : (data?.items || []).length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-500"
                  >
                    No backlog tasks
                  </td>
                </tr>
              ) : (
                data?.items.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {t.description}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {t.priority || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {t.task_type || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {t.workflow_state_name || t.workflow_state_id || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.assignees || []).map((a: any) => (
                          <span
                            key={a.assignee_id || a.id}
                            className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs"
                          >
                            {a.name || a.full_name || a.assignee_id}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {t.due_date || "—"}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {(data?.total_pages || 1) > 1 && (
        <div className="flex justify-end items-center gap-3 pt-2">
          <button
            className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            {page} / {data?.total_pages}
          </span>

          <button
            className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50"
            disabled={page >= (data?.total_pages || 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Backlog