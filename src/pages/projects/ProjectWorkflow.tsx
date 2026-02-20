import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import { staffApi } from '../../api/staff'
import { MoveOpenIssuesTo, sprintsApi } from '../../api/sprints'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import TaskDetailModal from './TaskDetailModal'

const ProjectWorkflow = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const getPermissions = useAuthStore(state => state.getPermissions)

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
    const previous = queryClient.getQueryData<any>(['tasks', id, selectedSprintId])

    queryClient.setQueryData(['tasks', id, selectedSprintId], (old: any) => {
      if (!old?.items) return old
      const items = old.items.map((t: any) =>
        t.id === draggableId ? { ...t, workflow_state_id: newStateId } : t
      )
      return { ...old, items }
    })

    try {
      await tasksApi.updateTask(draggableId, { workflow_state_id: newStateId })
      toast.success('Task moved')
    } catch (error: any) {
      queryClient.setQueryData(['tasks', id, selectedSprintId], previous)
      toast.error('Transition not allowed')
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
  const [showEndOptions, setShowEndOptions] = useState(false)
  const [endMoveOption, setEndMoveOption] = useState<'backlog' | 'next_sprint' | 'new_sprint'>('backlog')
  const [endNextSprintId, setEndNextSprintId] = useState<string | ''>('')
  const [endNewSprint, setEndNewSprint] = useState<any>({
    name: '',
    goal: '',
    status: 'planned',
    capacity: '',
    start_date: '',
    end_date: '',
  })
  const currentSprint: any | undefined = (sprints || []).find((s: any) => s.id === selectedSprintId)
  let sprintEndLabel: string | null = null
  if (currentSprint?.end_date) {
    const today = new Date()
    const end = new Date(currentSprint.end_date)
    const msPerDay = 1000 * 60 * 60 * 24
    today.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const diffDays = Math.round((end.getTime() - today.getTime()) / msPerDay)
    if (diffDays > 0) {
      sprintEndLabel = `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`
    } else if (diffDays === 0) {
      sprintEndLabel = 'Ends today'
    } else {
      const past = Math.abs(diffDays)
      sprintEndLabel = `${past} day${past === 1 ? '' : 's'} ago`
    }
  }

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

  const canViewProject = getPermissions('project:view')
  const canCreateTask = getPermissions('task:create')
  const canManageSprints = getPermissions('sprint:create')
  const canEndSprints = getPermissions('sprint:complete')

  if (!canViewProject) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view this project.</p>
      </div>
    )
  }

  if (!project || !workflow)
    return <div className="text-center py-10">Loading workflow…</div>

  return (
    <>
    <div className="flex flex-col bg-gray-50 overflow-hidden w-full h-full" style={{ height: 'calc(100vh - 80px)', maxWidth: '100%' }}>
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-3 space-y-2">

        {/* Row 1 – Project name */}
        <h1 className="text-lg font-semibold text-gray-900 leading-none">{project.name}</h1>

        {/* Row 2 – Sprint selector + end-date badge + action buttons */}
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Left: sprint selector + optional end-date */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sprint</span>
            <select
              className="input h-8 text-xs"
              value={selectedSprintId || ''}
              onChange={(e) => setSelectedSprintId(e.target.value || null)}
            >
              {(sprints || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>

            {currentSprint?.end_date && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Ends {currentSprint.end_date}
                {sprintEndLabel && ` · ${sprintEndLabel}`}
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canCreateTask && (
              <button className="btn-primary h-8 px-3 text-xs" onClick={() => setShowCreate(true)}>
                Create Task
              </button>
            )}
            <button className="btn-default h-8 px-3 text-xs" onClick={() => navigate(`/projects/${id}/backlog`)}>
              Backlog
            </button>
            {canManageSprints && (
              <button className="btn-default h-8 px-3 text-xs" onClick={() => setShowSprints(true)}>
                Sprints
              </button>
            )}
            <button className="btn-default h-8 px-3 text-xs" onClick={() => navigate(`/projects/${id}/workflow/settings`)}>
              Settings
            </button>
            <button className="btn-secondary h-8 px-3 text-xs" onClick={() => navigate(`/projects/${id}`)}>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Board area - add h-full to make overflow-x-auto contain properly */}
      <div className="flex-1 min-h-0 w-full overflow-hidden" style={{ maxWidth: '100%' }}>
        <div className="h-full w-full overflow-x-auto overflow-y-hidden" style={{ maxWidth: '100%' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="inline-flex gap-4 p-4 h-full min-w-max">

              {workflow.workflow_states
                ?.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map((state: any) => (
                  <Droppable droppableId={state.id} key={state.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col w-[360px] h-full"
                      >
                        {/* Column Header */}
                        <div
                          className="flex-none px-4 py-3 border-b flex items-center justify-between"
                          style={{ borderTop: `4px solid ${state.color || '#06B6D4'}` }}
                        >
                          <span className="font-semibold text-gray-900">{state.name}</span>
                          <span className="text-xs text-gray-500">
                            {(groupedTasks[state.id] || []).length}
                          </span>
                        </div>

                        {/* Column Body — vertically scrollable */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
                          {(groupedTasks[state.id] || []).map((task: any, index: number) => (
                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedTask(task)}
                                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer"
                                >
                                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex justify-between items-center text-xs mt-2">
                                    <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded">
                                      {task.priority}
                                    </span>
                                    <span className="text-gray-400">{task.progress_percentage ?? 0}%</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
            </div>
          </DragDropContext>
        </div>
      </div>


      {showCreate && canCreateTask && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4 sm:p-6">
    <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Create Task</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setShowCreate(false)}
        >
          ✕
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={submitCreate}
        className="p-6 space-y-10 flex-1 overflow-y-auto"
      >

        {/* BASIC INFO */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* TITLE */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Description
              </label>
              <textarea
                rows={4}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>

            {/* PRIORITY */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Priority
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
                }
              >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* TASK TYPE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Task Type
              </label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.task_type}
                onChange={(e) =>
                  setNewTask({ ...newTask, task_type: e.target.value })
                }
              />
            </div>
          </div>
        </section>

        {/* PLANNING */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Planning
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* SPRINT */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sprint
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={selectedSprintId || ""}
                onChange={(e) => setSelectedSprintId(e.target.value || null)}
              >
                {(sprints || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* START DATE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.start_date || ""}
                onChange={(e) =>
                  setNewTask({ ...newTask, start_date: e.target.value })
                }
              />
            </div>

            {/* DUE DATE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Due Date
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.due_date || ""}
                onChange={(e) =>
                  setNewTask({ ...newTask, due_date: e.target.value })
                }
              />
            </div>

            {/* HOURS */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.1"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.estimated_hours || ""}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    estimated_hours: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* COST */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Estimated Cost
              </label>
              <input
                type="number"
                step="0.01"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={newTask.estimated_cost || ""}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    estimated_cost: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* OPTIONS */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={newTask.milestone || false}
                onChange={(e) =>
                  setNewTask({ ...newTask, milestone: e.target.checked })
                }
              />
              Milestone
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={newTask.billable ?? true}
                onChange={(e) =>
                  setNewTask({ ...newTask, billable: e.target.checked })
                }
              />
              Billable
            </label>

            {/* TAGS */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tags (comma separated)
              </label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                value={(newTask.tags || []).join(", ")}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim()),
                  })
                }
              />
            </div>

            {/* CUSTOM FIELDS */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Custom Fields (JSON)
              </label>
              <textarea
                rows={3}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
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
        </section>

        {/* ASSIGNMENT */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">
            Assignment
          </h3>

          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Assigned To
          </label>

          {/* SEARCH */}
          <input
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                       focus:outline-none focus:border-indigo-600"
            placeholder="Search staff"
            value={assigneeSearch}
            onChange={(e) => setAssigneeSearch(e.target.value)}
          />

          {/* STAFF LIST */}
          <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white">
            {(staffOptions || [])
              .filter(({ name }) =>
                assigneeSearch
                  ? name.toLowerCase().includes(assigneeSearch.toLowerCase())
                  : true
              )
              .slice(0, 50)
              .map(({ id: sid, name }) => (
                <label
                  key={sid}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(sid)}
                    onChange={() => toggleAssignee(sid)}
                  />
                  {name}
                  <span className="ml-2 text-xs text-gray-500">{sid}</span>
                </label>
              ))}

            {(staffOptions || []).length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No staff found
              </div>
            )}
          </div>

          {/* SELECTED TAGS */}
          {assigneeIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {assigneeIds.map((sid) => {
                const label =
                  (staffOptions as any[]).find((s) => s.id === sid)?.name || sid
                return (
                  <span
                    key={sid}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                  >
                    {label}
                    <button
                      type="button"
                      className="ml-1 text-gray-600 hover:text-gray-900"
                      onClick={() => toggleAssignee(sid)}
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-5 py-2 rounded-md border text-gray-700 bg-white hover:bg-gray-100 text-sm"
            onClick={() => setShowCreate(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {showEndOptions && canEndSprints && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="text-xl font-semibold">End Sprint</div>
              <button className="text-secondary-500 hover:text-black" onClick={() => setShowEndOptions(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-secondary-700">Open issues detected in this sprint. Where should we move them?</p>
              <div>
                <label className="label">Move open issues to</label>
                <select className="input" value={endMoveOption} onChange={(e) => setEndMoveOption(e.target.value as MoveOpenIssuesTo)}>
                  <option value="backlog">Backlog</option>
                  <option value="next_sprint">Move to next sprint</option>
                  <option value="new_sprint">Create new sprint and move</option>
                </select>
              </div>
              {endMoveOption === 'next_sprint' && (
                <div>
                  <label className="label">Select Sprint</label>
                  <select className="input" value={endNextSprintId} onChange={(e) => setEndNextSprintId(e.target.value)}>
                    <option value="">Select</option>
                    {(sprints || []).filter((s: any) => (s.status === 'planned' || s.status === 'active') && s.id !== selectedSprintId).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                </div>
              )}
              {endMoveOption === 'new_sprint' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="label">Name</label><input className="input" value={endNewSprint.name} onChange={(e) => setEndNewSprint({ ...endNewSprint, name: e.target.value })} /></div>
                  <div className="md:col-span-2"><label className="label">Goal</label><textarea className="input" rows={3} value={endNewSprint.goal} onChange={(e) => setEndNewSprint({ ...endNewSprint, goal: e.target.value })} /></div>
                  <div><label className="label">Status</label><select className="input" value={endNewSprint.status} onChange={(e) => setEndNewSprint({ ...endNewSprint, status: e.target.value })}><option value="planned">planned</option><option value="active">active</option></select></div>
                  <div><label className="label">Capacity</label><input type="number" className="input" value={endNewSprint.capacity} onChange={(e) => setEndNewSprint({ ...endNewSprint, capacity: e.target.value })} /></div>
                  <div><label className="label">Start Date</label><input type="date" className="input" value={endNewSprint.start_date} onChange={(e) => setEndNewSprint({ ...endNewSprint, start_date: e.target.value })} /></div>
                  <div><label className="label">End Date</label><input type="date" className="input" value={endNewSprint.end_date} onChange={(e) => setEndNewSprint({ ...endNewSprint, end_date: e.target.value })} /></div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowEndOptions(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  try {
                    const payload: any = { move_open_issues_to: endMoveOption }
                    if (endMoveOption === 'next_sprint') payload.next_sprint = endNextSprintId || null
                    if (endMoveOption === 'new_sprint') payload.new_sprint = { project_id: id!, name: endNewSprint.name, goal: endNewSprint.goal || undefined, start_date: endNewSprint.start_date, end_date: endNewSprint.end_date, status: endNewSprint.status || 'planned', capacity: endNewSprint.capacity !== '' ? Number(endNewSprint.capacity) : undefined }
                    await sprintsApi.endSprint(String(selectedSprintId), payload)
                    toast.success('Sprint ended')
                    setShowEndOptions(false)
                    await queryClient.invalidateQueries(['sprints', id])
                    await queryClient.invalidateQueries(['tasks', id, selectedSprintId])
                    if (endMoveOption === 'next_sprint' && endNextSprintId) setSelectedSprintId(endNextSprintId)
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed to end sprint')
                  }
                }}
              >OK</button>
            </div>
          </div>
        </div>
      )}

{showSprints && canManageSprints && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
    <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sprints</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setShowSprints(false)
            setEditingSprint(null)
          }}
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LEFT PANEL — Sprint List */}
        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Sprint List
            </h3>

            <button
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              onClick={() => {
                setEditingSprint(null)
                setSprintForm({
                  name: "",
                  goal: "",
                  start_date: "",
                  end_date: "",
                  status: "planned",
                  capacity: ""
                })
              }}
            >
              New
            </button>
          </div>

          <div className="space-y-2">
            {(sprints || []).map((s: any) => (
              <button
                key={s.id}
                className={`
                  w-full text-left p-3 rounded-md border transition
                  ${editingSprint?.id === s.id
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 hover:bg-gray-50"}
                `}
                onClick={() => {
                  setEditingSprint(s)
                  setSprintForm({
                    name: s.name || "",
                    goal: s.goal || "",
                    start_date: s.start_date || "",
                    end_date: s.end_date || "",
                    status: s.status || "planned",
                    capacity: s.capacity ?? ""
                  })
                }}
              >
                <div className="font-medium text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {s.status} • {s.start_date} → {s.end_date}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — Create / Edit Form */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-4">
            {editingSprint ? "Edit Sprint" : "Create Sprint"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* NAME */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.name}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, name: e.target.value })
                }
              />
            </div>

            {/* GOAL */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Goal</label>
              <textarea
                rows={3}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.goal}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, goal: e.target.value })
                }
              />
            </div>

            {/* START DATE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.start_date}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, start_date: e.target.value })
                }
              />
            </div>

            {/* END DATE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.end_date}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, end_date: e.target.value })
                }
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.status}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, status: e.target.value })
                }
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* CAPACITY */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity</label>
              <input
                type="number"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-600"
                value={sprintForm.capacity}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, capacity: e.target.value })
                }
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">

            {editingSprint && (
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 text-sm"
                onClick={async () => {
                  try {
                    await sprintsApi.deleteSprint(editingSprint.id)
                    toast.success("Sprint deleted")
                    setEditingSprint(null)
                    setSprintForm({
                      name: "",
                      goal: "",
                      start_date: "",
                      end_date: "",
                      status: "planned",
                      capacity: ""
                    })
                    queryClient.invalidateQueries(["sprints", id])
                    if (selectedSprintId === editingSprint.id)
                      setSelectedSprintId(null)
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || "Failed to delete sprint")
                  }
                }}
              >
                Delete
              </button>
            )}

            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 text-sm"
              onClick={() => {
                setEditingSprint(null)
                setSprintForm({
                  name: "",
                  goal: "",
                  start_date: "",
                  end_date: "",
                  status: "planned",
                  capacity: ""
                })
              }}
            >
              Reset
            </button>

            <button
              className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              onClick={async () => {
                try {
                  if (editingSprint) {
                    await sprintsApi.updateSprint(editingSprint.id, {
                      name: sprintForm.name || undefined,
                      goal: sprintForm.goal || undefined,
                      start_date: sprintForm.start_date || undefined,
                      end_date: sprintForm.end_date || undefined,
                      status: sprintForm.status || "planned",
                      capacity:
                        sprintForm.capacity !== ""
                          ? Number(sprintForm.capacity)
                          : undefined
                    })
                    toast.success("Sprint updated")
                  } else {
                    const created = await sprintsApi.createSprint({
                      project_id: id!,
                      name: sprintForm.name,
                      goal: sprintForm.goal || undefined,
                      start_date: sprintForm.start_date,
                      end_date: sprintForm.end_date,
                      status: sprintForm.status || "planned",
                      capacity:
                        sprintForm.capacity !== ""
                          ? Number(sprintForm.capacity)
                          : undefined
                    })
                    toast.success("Sprint created")
                    setSelectedSprintId(created.id)
                  }

                  queryClient.invalidateQueries(["sprints", id])
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed to save sprint")
                }
              }}
            >
              {editingSprint ? "Save Changes" : "Create Sprint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {selectedTask && (
        <TaskDetailModal
          projectId={id!}
          sprintId={selectedSprintId}
          workflowStates={workflow?.workflow_states || []}
          selectedTask={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

    </div>
    </>
  )
}

export default ProjectWorkflow
