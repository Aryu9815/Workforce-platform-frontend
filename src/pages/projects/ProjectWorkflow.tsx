import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import toast from 'react-hot-toast'

const ProjectWorkflow = () => {
  const navigate = useNavigate()
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
    queryFn: () => tasksApi.getTasks({ project_id: id!, page_size: 100 }),
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

  // Create Task modal
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState<any>({
    title: '',
    description: '',
    priority: 'medium',
    task_type: '',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    estimated_cost: '',
    milestone: false,
    billable: true,
    tags: [],
    custom_fields: {},
  })

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tasksApi.createTask({
        project_id: id!,
        ...newTask,
      })

      toast.success('Task created')
      setShowCreate(false)
      setNewTask({ title: '', description: '', priority: '', task_type: '' })
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">

            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Task</h2>
              <button
                className="text-secondary-500 hover:text-black"
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCreate} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* ================= BASIC INFO ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="md:col-span-2">
                    <label className="label">Title *</label>
                    <input
                      className="input"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">Priority</label>
                    <select
                      className="input"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Task Type</label>
                    <input
                      className="input"
                      value={newTask.task_type}
                      onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                    />
                  </div>

                </div>
              </div>

              {/* ================= PLANNING ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Planning</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      value={newTask.start_date || ''}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      className="input"
                      value={newTask.due_date || ''}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">Estimated Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={newTask.estimated_hours || ''}
                      onChange={(e) =>
                        setNewTask({ ...newTask, estimated_hours: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <label className="label">Estimated Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={newTask.estimated_cost || ''}
                      onChange={(e) =>
                        setNewTask({ ...newTask, estimated_cost: Number(e.target.value) })
                      }
                    />
                  </div>

                </div>
              </div>

              {/* ================= OPTIONS ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Options</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTask.milestone || false}
                      onChange={(e) =>
                        setNewTask({ ...newTask, milestone: e.target.checked })
                      }
                    />
                    Milestone
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTask.billable ?? true}
                      onChange={(e) =>
                        setNewTask({ ...newTask, billable: e.target.checked })
                      }
                    />
                    Billable
                  </label>

                  <div className="md:col-span-2">
                    <label className="label">Tags (comma separated)</label>
                    <input
                      className="input"
                      value={(newTask.tags || []).join(', ')}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          tags: e.target.value.split(',').map((t) => t.trim()),
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Custom Fields (JSON)</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={JSON.stringify(newTask.custom_fields || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          setNewTask({
                            ...newTask,
                            custom_fields: JSON.parse(e.target.value),
                          })
                        } catch {}
                      }}
                    />
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
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
