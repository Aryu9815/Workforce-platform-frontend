import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { tasksApi } from '../../api/tasks'
import { Task } from '../../types'

const TaskList = () => {
  const [page] = useState(1)
  const [search, setSearch] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, search],
    queryFn: () => tasksApi.getTasks({
      page,
      page_size: 20,
    }),
  })
  
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'badge-default',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger',
    }
    return <span className={styles[priority] || 'badge-default'}>{priority}</span>
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">Manage tasks across all projects</p>
        </div>
        <Link to="/tasks/new" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          New Task
        </Link>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Task</th>
              <th className="table-header-cell">Priority</th>
              <th className="table-header-cell">Progress</th>
              <th className="table-header-cell">Due Date</th>
              <th className="table-header-cell">Assignees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="table-cell text-center py-8">Loading...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-cell text-center py-8 text-secondary-500">
                  No tasks found
                </td>
              </tr>
            ) : (
              data?.items.map((task: Task) => (
                <tr key={task.id} className="table-row cursor-pointer">
                  <td className="table-cell">
                    <Link to={`/tasks/${task.id}`}>
                      <p className="text-sm font-medium text-secondary-900">{task.title}</p>
                      {task.task_type && (
                        <p className="text-xs text-secondary-500">{task.task_type}</p>
                      )}
                    </Link>
                  </td>
                  <td className="table-cell">{getPriorityBadge(task.priority)}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-secondary-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-primary-600 rounded-full"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-secondary-600">{task.progress_percentage}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {task.due_date ? (
                      new Date(task.due_date).toLocaleDateString()
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {task.assignees?.length > 0 ? (
                      <div className="flex -space-x-2">
                        {task.assignees.slice(0, 3).map((assignee, i) => (
                          <div
                            key={i}
                            className="h-8 w-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center"
                          >
                            <span className="text-xs font-medium text-primary-700">
                              {assignee.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-secondary-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-secondary-600">
                              +{task.assignees.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-secondary-400 text-sm">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TaskList
