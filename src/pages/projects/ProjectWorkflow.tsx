import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import { staffApi } from '../../api/staff'
import { sprintsApi } from '../../api/sprints'
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

  const { data: sprints } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => sprintsApi.listSprints({ project_id: id! }),
    enabled: !!id,
  })
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const activeDefault = useMemo(() => {
    const list = sprints || []
    console.log('Sprints:', list)
    const active = list.find((s: any) => s.status === 'active')
    return active?.id || (list[0]?.id ?? null)
  }, [sprints])
  useEffect(() => {
    if (selectedSprintId === null && activeDefault) {
      setSelectedSprintId(activeDefault)
    }
  }, [activeDefault, selectedSprintId])
  const { data: tasks } = useQuery({
    queryKey: ['tasks', id, selectedSprintId],
    queryFn: () => tasksApi.getTasks({ project_id: id!, page_size: 100, sprint_id: selectedSprintId || undefined }),
    enabled: !!id && !!selectedSprintId,
  })
  const { data: staffNames } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })
  const staffOptions =
    Array.isArray(staffNames)
      ? (staffNames as any[]).map((s: any) => ({ id: s.id, name: s.name }))
      : staffNames
      ? Object.entries(staffNames as Record<string, string>).map(([sid, name]) => ({
          id: sid,
          name: String(name),
        }))
      : []

  const groupedTasks = useMemo(() => {
    const byState: Record<string, any[]> = {}
    if (tasks?.items) {
      for (const t of tasks.items) {
        const key = t.workflow_state_id
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

    // Optimistic update for smooth DnD
    const previous = queryClient.getQueryData<any>(['tasks', id])
    queryClient.setQueryData(['tasks', id], (old: any) => {
      if (!old?.items) return old
      const items = old.items.map((t: any) =>
        t.id === draggableId ? { ...t, workflow_state_id: newStateId } : t
      )
      return { ...old, items }
    })
    try {
      await tasksApi.updateTask(String(draggableId), {
        workflow_state_id: newStateId,
      })
      toast.success('Task moved')
    } catch (error: any) {
      queryClient.setQueryData(key, previous)
      toast.error(error?.response?.data?.detail || 'Transition not allowed')
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
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const toggleAssignee = (sid: string) => {
    setAssigneeIds(prev =>
      prev.includes(sid) ? prev.filter(id2 => id2 !== sid) : [...prev, sid]
    )
  }
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const selectedTaskId = selectedTask?.id || null
  const { data: taskDetail } = useQuery({
    queryKey: ['task', selectedTaskId],
    queryFn: () => tasksApi.getTask(selectedTaskId!),
    enabled: !!selectedTaskId,
  })
  const { data: taskComments, refetch: refetchComments } = useQuery({
    queryKey: ['task-comments', selectedTaskId],
    queryFn: () => tasksApi.getTaskComments(selectedTaskId!),
    enabled: !!selectedTaskId,
  })
  const [showSprints, setShowSprints] = useState(false)
  const [editingSprint, setEditingSprint] = useState<any | null>(null)
  const [sprintForm, setSprintForm] = useState<any>({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
    status: 'planned',
    capacity: '',
  })
  const [newComment, setNewComment] = useState('')
  const [newCommentInternal, setNewCommentInternal] = useState(false)
  const [editCommentId, setEditCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [replyForId, setReplyForId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyInternal, setReplyInternal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({
    title: '',
    description: '',
    workflow_state_id: '',
    priority: '',
    estimated_hours: '',
    actual_hours: '',
    due_date: '',
    completed_at: '',
    progress_percentage: '',
    billable: true,
    tags: [],
  })

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const defaultState =
        (workflow?.workflow_states || []).find((s: any) => s.is_initial) ||
        (workflow?.workflow_states || [])[0]
      await tasksApi.createTask({
        project_id: id!,
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority || undefined,
        task_type: newTask.task_type || undefined,
        start_date: newTask.start_date || undefined,
        due_date: newTask.due_date || undefined,
        estimated_hours:
          newTask.estimated_hours !== '' ? Number(newTask.estimated_hours) : undefined,
        estimated_cost:
          newTask.estimated_cost !== '' ? Number(newTask.estimated_cost) : undefined,
        milestone: newTask.milestone || undefined,
        billable: newTask.billable || undefined,
        tags: (newTask.tags || []).length ? newTask.tags : undefined,
        workflow_state_id: defaultState?.id,
        sprint_id: selectedSprintId || undefined,
        assignee_ids: assigneeIds.length ? assigneeIds : undefined,
      })

      toast.success('Task created')
      setShowCreate(false)
      setNewTask({
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
      setAssigneeIds([])
      setAssigneeSearch('')
      queryClient.invalidateQueries(['tasks', id, selectedSprintId])
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold">{project.name}</div>
            <div className="text-secondary-500">Workflow Board</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-700">Sprint</span>
            <select
              className="input"
              value={selectedSprintId || ''}
              onChange={(e) => setSelectedSprintId(e.target.value || null)}
            >
              {(sprints || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
            <button
              className="btn-default"
              onClick={() => setShowSprints(true)}
            >
              Sprints
            </button>
          </div>
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
                            draggableId={String(task.id)}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-3 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md cursor-pointer transition text-left"
                                onClick={() => setSelectedTask(task)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

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

            <form onSubmit={submitCreate} className="p-6 space-y-6 flex-1 overflow-y-auto">

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

              <div>
                <h3 className="text-lg font-semibold mb-3">Planning</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Sprint</label>
                    <select
                      className="input"
                      value={selectedSprintId || ''}
                      onChange={(e) => setSelectedSprintId(e.target.value || null)}
                    >
                      {(sprints || []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

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

              {/* ================= ASSIGNMENT ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Assignment</h3>
                <div>
                  <label className="label">Assigned To</label>
                  <input
                    className="input"
                    placeholder="Search staff"
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                  />
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-secondary-200 bg-white">
                    {(staffOptions || [])
                      .filter(({ name }) =>
                        assigneeSearch ? name.toLowerCase().includes(assigneeSearch.toLowerCase()) : true
                      )
                      .slice(0, 50)
                      .map(({ id: sid, name }) => (
                        <label key={sid} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary-50">
                          <input
                            type="checkbox"
                            checked={assigneeIds.includes(sid)}
                            onChange={() => toggleAssignee(sid)}
                          />
                          <span className="text-sm text-secondary-900">{name}</span>
                          <span className="ml-2 text-xs text-secondary-500">{sid}</span>
                        </label>
                      ))}
                    {(staffOptions || []).length === 0 && (
                      <div className="px-3 py-2 text-sm text-secondary-500">No staff found</div>
                    )}
                  </div>
                  {assigneeIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assigneeIds.map((sid) => {
                        const label = (staffOptions as any[]).find((s) => s.id === sid)?.name || sid
                        return (
                          <span
                            key={sid}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-100 text-secondary-800 text-xs"
                          >
                            {label}
                            <button
                              type="button"
                              className="ml-1 text-secondary-600 hover:text-secondary-900"
                              onClick={() => toggleAssignee(sid)}
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

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

      {showSprints && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="text-xl font-semibold">Sprints</div>
              <button className="text-secondary-500 hover:text-black" onClick={() => { setShowSprints(false); setEditingSprint(null) }}>
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold">Sprint List</div>
                  <button
                    className="btn-default"
                    onClick={() => {
                      setEditingSprint(null)
                      setSprintForm({ name: '', goal: '', start_date: '', end_date: '', status: 'planned', capacity: '' })
                    }}
                  >
                    New
                  </button>
                </div>
                <div className="space-y-2">
                  {(sprints || []).map((s: any) => (
                    <button
                      key={s.id}
                      className={`w-full text-left p-3 rounded border ${editingSprint?.id === s.id ? 'border-primary-300 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}
                      onClick={() => {
                        setEditingSprint(s)
                        setSprintForm({
                          name: s.name || '',
                          goal: s.goal || '',
                          start_date: s.start_date || '',
                          end_date: s.end_date || '',
                          status: s.status || 'planned',
                          capacity: s.capacity ?? '',
                        })
                      }}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-secondary-500">{s.status} • {s.start_date} → {s.end_date}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold mb-3">{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Name</label>
                    <input className="input" value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Goal</label>
                    <textarea className="input" rows={3} value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input type="date" className="input" value={sprintForm.start_date} onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input type="date" className="input" value={sprintForm.end_date} onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={sprintForm.status} onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value })}>
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Capacity</label>
                    <input type="number" className="input" value={sprintForm.capacity} onChange={(e) => setSprintForm({ ...sprintForm, capacity: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  {editingSprint && (
                    <button
                      className="btn-secondary"
                      onClick={async () => {
                        try {
                          await sprintsApi.deleteSprint(editingSprint.id)
                          toast.success('Sprint deleted')
                          setEditingSprint(null)
                          setSprintForm({ name: '', goal: '', start_date: '', end_date: '', status: 'planned', capacity: '' })
                          queryClient.invalidateQueries(['sprints', id])
                          if (selectedSprintId === editingSprint.id) {
                            setSelectedSprintId(null)
                          }
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed to delete sprint')
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    className="btn-default"
                    onClick={() => {
                      setEditingSprint(null)
                      setSprintForm({ name: '', goal: '', start_date: '', end_date: '', status: 'planned', capacity: '' })
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      try {
                        if (editingSprint) {
                          const payload: any = {
                            name: sprintForm.name || undefined,
                            goal: sprintForm.goal || undefined,
                            start_date: sprintForm.start_date || undefined,
                            end_date: sprintForm.end_date || undefined,
                            status: sprintForm.status || undefined,
                            capacity: sprintForm.capacity !== '' ? Number(sprintForm.capacity) : undefined,
                          }
                          await sprintsApi.updateSprint(editingSprint.id, payload)
                          toast.success('Sprint updated')
                        } else {
                          const payload: any = {
                            project_id: id!,
                            name: sprintForm.name,
                            goal: sprintForm.goal || undefined,
                            start_date: sprintForm.start_date,
                            end_date: sprintForm.end_date,
                            status: sprintForm.status || 'planned',
                            capacity: sprintForm.capacity !== '' ? Number(sprintForm.capacity) : undefined,
                          }
                          const created = await sprintsApi.createSprint(payload)
                          toast.success('Sprint created')
                          setSelectedSprintId(created.id)
                        }
                        queryClient.invalidateQueries(['sprints', id])
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || 'Failed to save sprint')
                      }
                    }}
                  >
                    {editingSprint ? 'Save Changes' : 'Create Sprint'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button className="btn-secondary" onClick={() => { setShowSprints(false); setEditingSprint(null) }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Task details modal with staff and comments */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{taskDetail?.title || selectedTask.title}</h2>
              <button
                className="text-secondary-500 hover:text-black"
                onClick={() => setSelectedTask(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {taskDetail?.description && (
                <p className="text-secondary-700">{taskDetail.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-secondary-500">Priority:</span> {taskDetail?.priority || '—'}</div>
                <div><span className="text-secondary-500">Type:</span> {taskDetail?.task_type || '—'}</div>
                <div><span className="text-secondary-500">Estimated Hours:</span> {taskDetail?.estimated_hours ?? '—'}</div>
                <div><span className="text-secondary-500">Estimated Cost:</span> {taskDetail?.estimated_cost ?? '—'}</div>
                <div><span className="text-secondary-500">Actual Hours:</span> {taskDetail?.actual_hours ?? '—'}</div>
                <div><span className="text-secondary-500">Actual Cost:</span> {taskDetail?.actual_cost ?? '—'}</div>
                <div><span className="text-secondary-500">Start Date:</span> {taskDetail?.start_date || '—'}</div>
                <div><span className="text-secondary-500">Due Date:</span> {taskDetail?.due_date || '—'}</div>
                <div><span className="text-secondary-500">Completed At:</span> {taskDetail?.completed_at || '—'}</div>
                <div><span className="text-secondary-500">Parent Task:</span> {taskDetail?.parent_task_id || '—'}</div>
                <div><span className="text-secondary-500">Workflow State:</span> {taskDetail?.workflow_state_name || taskDetail?.workflow_state_id || '—'}</div>
                <div><span className="text-secondary-500">Progress:</span> {taskDetail?.progress_percentage ?? 0}%</div>
                <div><span className="text-secondary-500">Milestone:</span> {taskDetail?.milestone ? 'Yes' : 'No'}</div>
                <div><span className="text-secondary-500">Billable:</span> {taskDetail?.billable ? 'Yes' : 'No'}</div>
              </div>
              {!editMode && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-default"
                    onClick={() => {
                      if (!taskDetail) return
                      setEditData({
                        title: taskDetail.title || '',
                        description: taskDetail.description || '',
                        workflow_state_id: taskDetail.workflow_state_id || '',
                        priority: taskDetail.priority || '',
                        estimated_hours: taskDetail.estimated_hours ?? '',
                        actual_hours: taskDetail.actual_hours ?? '',
                        due_date: taskDetail.due_date || '',
                        completed_at: taskDetail.completed_at || '',
                        progress_percentage: taskDetail.progress_percentage ?? '',
                        billable: taskDetail.billable ?? true,
                        tags: taskDetail.tags || [],
                      })
                      setEditMode(true)
                    }}
                  >
                    Edit Task
                  </button>
                </div>
              )}
              {editMode && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Title</label>
                      <input className="input" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Priority</label>
                      <select className="input" value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}>
                        <option value="">Select</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <textarea className="input" rows={3} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Workflow State</label>
                      <select
                        className="input"
                        value={editData.workflow_state_id}
                        onChange={(e) => setEditData({ ...editData, workflow_state_id: e.target.value })}
                      >
                        <option value="">Select</option>
                        {(workflow?.workflow_states || []).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Estimated Hours</label>
                      <input type="number" step="0.1" className="input" value={editData.estimated_hours} onChange={(e) => setEditData({ ...editData, estimated_hours: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Actual Hours</label>
                      <input type="number" step="0.1" className="input" value={editData.actual_hours} onChange={(e) => setEditData({ ...editData, actual_hours: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input type="date" className="input" value={editData.due_date || ''} onChange={(e) => setEditData({ ...editData, due_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Completed At</label>
                      <input type="datetime-local" className="input" value={editData.completed_at || ''} onChange={(e) => setEditData({ ...editData, completed_at: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Progress %</label>
                      <input type="number" min={0} max={100} className="input" value={editData.progress_percentage} onChange={(e) => setEditData({ ...editData, progress_percentage: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!editData.billable}
                        onChange={(e) => setEditData({ ...editData, billable: e.target.checked })}
                      />
                      Billable
                    </label>
                    <div className="md:col-span-2">
                      <label className="label">Tags (comma separated)</label>
                      <input
                        className="input"
                        value={(editData.tags || []).join(', ')}
                        onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(',').map((t: string) => t.trim()) })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={async () => {
                        try {
                          const payload: any = {
                            title: editData.title || undefined,
                            description: editData.description || undefined,
                            workflow_state_id: editData.workflow_state_id || undefined,
                            priority: editData.priority || undefined,
                            estimated_hours: editData.estimated_hours !== '' ? Number(editData.estimated_hours) : undefined,
                            actual_hours: editData.actual_hours !== '' ? Number(editData.actual_hours) : undefined,
                            due_date: editData.due_date || undefined,
                            completed_at: editData.completed_at || undefined,
                            progress_percentage: editData.progress_percentage !== '' ? Number(editData.progress_percentage) : undefined,
                            billable: typeof editData.billable === 'boolean' ? editData.billable : undefined,
                            tags: (editData.tags || []).length ? editData.tags : undefined,
                          }
                          await tasksApi.updateTask(String(selectedTaskId!), payload)
                          toast.success('Task updated')
                          setEditMode(false)
                          // ensure board reflects new state
                          queryClient.invalidateQueries(['task', selectedTaskId])
                          queryClient.invalidateQueries(['tasks', id, selectedSprintId])
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed to update task')
                        }
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-2">Assigned Staff</h3>
                <div className="flex flex-wrap gap-2">
                  {(taskDetail?.assignees || selectedTask.assignees || []).length === 0 && (
                    <span className="text-secondary-500 text-sm">No assignees</span>
                  )}
                  {(taskDetail?.assignees || selectedTask.assignees || []).map((a: any) => {
                    const sid = a?.assignee_id
                    const label = a?.name || '—'
                    return (
                      <span key={sid || label} className="px-2 py-1 rounded bg-secondary-100 text-secondary-800 text-xs">
                        {label}{a?.is_primary ? ' (Primary)' : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-2">Comments</h3>
                <div className="space-y-3">
                  {(taskComments || []).length === 0 && (
                    <div className="text-sm text-secondary-500">No comments yet</div>
                  )}
                  {(taskComments || []).map((c: any) => (
                    <div key={c.id} className="border rounded-lg p-3">
                      {editCommentId === c.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="input"
                            rows={3}
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setEditCommentId(null)
                                setEditCommentContent('')
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={async () => {
                                try {
                                  await tasksApi.updateTaskComment(selectedTaskId!, c.id, { content: editCommentContent })
                                  setEditCommentId(null)
                                  setEditCommentContent('')
                                  refetchComments()
                                  toast.success('Comment updated')
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Failed to update comment')
                                }
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm">
                            <div className="text-secondary-900 whitespace-pre-wrap">{c.content || 'deleted'}</div>
                            <div className="text-xs text-secondary-500 mt-1">
                              {c.is_internal ? 'Internal' : 'Public'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-default"
                              onClick={() => {
                                setEditCommentId(c.id)
                                setEditCommentContent(c.content || '')
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-default"
                              onClick={() => {
                                setReplyForId(c.id)
                                setReplyContent('')
                                setReplyInternal(false)
                              }}
                            >
                              Reply
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={async () => {
                                try {
                                  await tasksApi.deleteTaskComment(selectedTaskId!, c.id)
                                  refetchComments()
                                  toast.success('Comment deleted')
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Failed to delete comment')
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                      {replyForId === c.id && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            className="input"
                            rows={3}
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                          />
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={replyInternal}
                              onChange={(e) => setReplyInternal(e.target.checked)}
                            />
                            Internal
                          </label>
                          <div className="flex gap-2 justify-end">
                            <button type="button" className="btn-secondary" onClick={() => { setReplyForId(null); setReplyContent(''); setReplyInternal(false) }}>Cancel</button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={async () => {
                                if (!replyContent.trim()) return
                                try {
                                  await tasksApi.addTaskComment(String(selectedTaskId!), { content: replyContent.trim(), is_internal: replyInternal, parent_comment_id: c.id })
                                  setReplyForId(null)
                                  setReplyContent('')
                                  setReplyInternal(false)
                                  refetchComments()
                                  toast.success('Reply added')
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Failed to add reply')
                                }
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t pt-4 space-y-2">
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newCommentInternal}
                      onChange={(e) => setNewCommentInternal(e.target.checked)}
                    />
                    Internal
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={async () => {
                        if (!newComment.trim()) return
                        try {
                          await tasksApi.addTaskComment(selectedTaskId!, {task_id: selectedTaskId!, content: newComment.trim(), is_internal: newCommentInternal })
                          setNewComment('')
                          setNewCommentInternal(false)
                          refetchComments()
                          toast.success('Comment added')
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed to add comment')
                        }
                      }}
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button className="btn-secondary" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProjectWorkflow
