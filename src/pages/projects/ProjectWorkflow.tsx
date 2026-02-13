import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import toast from 'react-hot-toast'

const ProjectWorkflow = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })

  const workflowId = project?.workflow_id

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => projectsApi.getWorkflow(workflowId!),
    enabled: !!workflowId,
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getTasks({ project_id: id!, page_size: 1000 }),
    enabled: !!id,
  })

  const groupedTasks = useMemo(() => {
    const byState: Record<string, any[]> = {}
    if (tasks?.items) {
      for (const t of tasks.items) {
        const key = t.status_id
        if (!byState[key]) byState[key] = []
        byState[key].push(t)
      }
    }
    return byState
  }, [tasks])

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const newStateId = destination.droppableId

    try {
      await tasksApi.updateTask(draggableId, {
        status_id: newStateId,
      })

      toast.success('Task moved successfully')

      // Refresh tasks
      queryClient.invalidateQueries(['tasks', id])
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          'Transition not allowed'
      )
    }
  }

  // Sidebar toggle integration (broadcast event + localStorage)
  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen')
    if (stored !== null) {
      setSidebarOpen(stored === 'true')
    }
    const handler = (e: any) => {
      if (e?.detail?.sidebarOpen !== undefined) {
        setSidebarOpen(e.detail.sidebarOpen)
      }
    }
    window.addEventListener('sidebar-toggle', handler as EventListener)
    return () => window.removeEventListener('sidebar-toggle', handler as EventListener)
  }, [])
  const toggleSidebar = () => {
    const next = !sidebarOpen
    localStorage.setItem('sidebarOpen', String(next))
    const evt = new CustomEvent('sidebar-toggle', { detail: { sidebarOpen: next } })
    window.dispatchEvent(evt)
  }

  // Create Task modal
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '',
    task_type: '',
    status_id: '',
  })
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tasksApi.createTask({
        project_id: id!,
        title: newTask.title,
        description: newTask.description || undefined,
        priority: (newTask.priority as any) || undefined,
        task_type: newTask.task_type || undefined,
        status_id: newTask.status_id || undefined,
      })
      toast.success('Task created')
      setShowCreate(false)
      setNewTask({ title: '', description: '', priority: '', task_type: '', status_id: '' })
      queryClient.invalidateQueries(['tasks', id])
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create task'
      toast.error(msg)
    }
  }

  if (!project || !workflow) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-secondary-500">Workflow Board</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-default" onClick={toggleSidebar}>
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <button className="btn-default" onClick={() => navigate(`/projects/${id}/workflow/settings`)}>
            Settings
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            Create Task
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/projects/${id}`)}
          >
            Back
          </button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {(workflow.workflow_states || [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((state: any) => (
              <Droppable droppableId={state.id} key={state.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-shrink-0 w-80 bg-secondary-50 rounded-lg border border-secondary-200"
                  >
                    {/* Column Header */}
                    <div
                      className="p-3 border-b bg-white rounded-t-lg"
                      style={{ borderTop: `4px solid ${state.color || '#ccc'}` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {state.name}
                        </span>
                        <span className="text-xs text-secondary-500">
                          {(groupedTasks[state.id] || []).length}
                        </span>
                      </div>
                    </div>

                    {/* Column Body */}
                    <div className="p-3 space-y-3 min-h-[200px] overflow-y-auto">
                      {(groupedTasks[state.id] || []).map(
                        (task: any, index: number) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-3 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md cursor-pointer transition"
                              >
                                <p className="text-sm font-medium">
                                  {task.title}
                                </p>

                                {task.description && (
                                  <p className="text-xs text-secondary-600 mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="mt-2 flex justify-between items-center text-xs">
                                  <span className="badge-info">
                                    {task.priority}
                                  </span>
                                  <span className="text-secondary-400">
                                    {task.progress_percentage ?? 0}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
        </div>
      </DragDropContext>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Create Task</h3>
              <button className="p-2 rounded-lg hover:bg-secondary-100" onClick={() => setShowCreate(false)}>
                Close
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-4 space-y-3">
              <input
                className="input"
                placeholder="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <textarea
                className="input"
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
              <select
                className="input"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="">Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                className="input"
                placeholder="Type"
                value={newTask.task_type}
                onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
              />
              <select
                className="input"
                value={newTask.status_id}
                onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
                required
              >
                <option value="">Select State</option>
                {(workflow.workflow_states || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectWorkflow
