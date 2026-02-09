import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, Calendar, CheckCircle } from 'lucide-react'
import { tasksApi } from '../../api/tasks'

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getTask(id!),
    enabled: !!id,
  })
  
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }
  
  if (!task) {
    return <div className="text-center py-8">Task not found</div>
  }
  
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/tasks')}
            className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="page-title">{task.title}</h1>
              {getPriorityBadge(task.priority)}
              {task.milestone && <span className="badge badge-info">Milestone</span>}
            </div>
            {task.task_type && <p className="page-description">{task.task_type}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="btn-danger">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Task info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Description</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary-700">{task.description || 'No description provided.'}</p>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">Progress</span>
                  <span className="text-sm text-secondary-500">{task.progress_percentage}%</span>
                </div>
                <div className="h-3 bg-secondary-200 rounded-full">
                  <div
                    className="h-3 bg-primary-600 rounded-full transition-all"
                    style={{ width: `${task.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Comments placeholder */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Comments</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary-500 text-center py-4">No comments yet</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm text-secondary-500">Due Date</p>
                  <p className="text-sm font-medium text-secondary-900">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm text-secondary-500">Status</p>
                  <p className="text-sm font-medium text-secondary-900">
                    {task.status_name || 'Not set'}
                  </p>
                </div>
              </div>
              
              {task.estimated_hours && (
                <div>
                  <p className="text-sm text-secondary-500">Estimated Hours</p>
                  <p className="text-sm font-medium text-secondary-900">{task.estimated_hours}h</p>
                </div>
              )}
              
              {task.actual_hours > 0 && (
                <div>
                  <p className="text-sm text-secondary-500">Actual Hours</p>
                  <p className="text-sm font-medium text-secondary-900">{task.actual_hours}h</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Assignees */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Assignees</h3>
            </div>
            <div className="card-body">
              {task.assignees?.length > 0 ? (
                <ul className="space-y-2">
                  {task.assignees.map((assignee, i) => (
                    <li key={i} className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">
                          {assignee.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="ml-2 text-sm text-secondary-700">{assignee.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary-500 text-center py-4">No assignees</p>
              )}
            </div>
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Tags</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
