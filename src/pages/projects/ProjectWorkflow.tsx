
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import { staffApi } from '../../api/staff'
import { MoveOpenIssuesTo, sprintsApi } from '../../api/sprints'
import { taskLabelsApi } from '../../api/taskLabelsApi'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import TaskDetailModal from './TaskDetailModal'
import { getErrorMessage } from '../../lib/utils'
import { AIRegenerateButton } from '../../components/ui/AIRegenerateButton'
import { AutoResizingTextarea } from '../../components/ui/AutoResizingTextarea'

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
  const [selectedLabelId, setSelectedLabelId] = useState('')
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
  const { data: taskLabels } = useQuery({
    queryKey: ['task-labels', id],
    queryFn: () => taskLabelsApi.getTaskLabelsByProject(id!),
    enabled: !!id,
  })
  const { data: staffNames } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })
  const { data: ticketNumbers } = useQuery({
    queryKey: ['task-tickets', selectedSprintId],
    queryFn: () => tasksApi.getTickets(selectedSprintId!),
    enabled: !!selectedSprintId,
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
      const filteredItems = selectedLabelId ? tasks.items.filter((t: any) => t.task_label_id === selectedLabelId) : tasks.items
      for (const t of filteredItems) {
        const key = t.workflow_state_id
        if (!byState[key]) byState[key] = []
        byState[key].push(t)
      }
    }
    return byState
  }, [tasks, selectedLabelId])

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
      toast.error(getErrorMessage(error, 'Failed to move task'))
    }
  }

  // Create Task modal
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState<any>({
    title: '',
    task_label_id: '',
    description: '',
    priority: 'medium',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    estimated_cost: '',
    milestone: false,
    billable: true,
    tags: [],
    custom_fields: {},
    parent_task_id: '',
  })
  const [taskAssignees, setTaskAssignees] = useState<{ staff_id: string; role: string }[]>([])
  
  const [showAssigneeModal, setShowAssigneeModal] = useState(false)
  const [selectedAssigneeStaffId, setSelectedAssigneeStaffId] = useState('')
  const [selectedAssigneeRole, setSelectedAssigneeRole] = useState('')
  
  const handleAddAssignee = () => {
    if (!selectedAssigneeStaffId || !selectedAssigneeRole) return
    setTaskAssignees((prev) => [
      ...prev,
      { staff_id: selectedAssigneeStaffId, role: selectedAssigneeRole },
    ])
    setShowAssigneeModal(false)
    setSelectedAssigneeStaffId('')
    setSelectedAssigneeRole('')
  }
  
  const handleRemoveAssignee = (staffId: string, role: string) => {
    setTaskAssignees((prev) =>
      prev.filter((a) => !(a.staff_id === staffId && a.role === role))
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
  const [sprintEditMode, setSprintEditMode] = useState(false)
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
  useEffect(() => {
    if (showSprints) {
      const list = sprints || []
      const active = list.find((s: any) => s.status === 'active') || list[0] || null
      if (active && !editingSprint) {
        setEditingSprint(active)
        setSprintForm({
          name: active.name || '',
          goal: active.goal || '',
          start_date: active.start_date || '',
          end_date: active.end_date || '',
          status: active.status || 'planned',
          capacity: active.capacity ?? '',
        })
        setSprintEditMode(false)
      }
    }
  }, [showSprints, sprints])

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const defaultState =
        (workflow?.workflow_states || []).find((s: any) => s.is_initial) ||
        (workflow?.workflow_states || [])[0]
      await tasksApi.createTask({
        project_id: id!,
        title: newTask.title,
        task_label_id: newTask.task_label_id || undefined,
        description: newTask.description || undefined,
        priority: newTask.priority || undefined,
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
        assignees: taskAssignees.length ? taskAssignees : undefined,
        parent_task_id: newTask.parent_task_id || undefined,
        is_blocked_by_task: newTask.parent_task_id ? true : undefined,
      })

      toast.success('Task created')
      setShowCreate(false)
      setNewTask({
        title: '',
        task_label_id: '',
        description: '',
        priority: 'medium',
        start_date: '',
        due_date: '',
        estimated_hours: '',
        estimated_cost: '',
        milestone: false,
        billable: true,
        tags: [],
        parent_task_id: '',
      })
      setTaskAssignees([])
      queryClient.invalidateQueries({ queryKey: ['tasks', id, selectedSprintId] })
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to create task'))
    }
  }

  const canViewProject = getPermissions('project:view')
  const canViewSprint = getPermissions('sprint:view')
  const canCreateTask = getPermissions('task:create')
  const canManageSprints = getPermissions('sprint:create')
  const canEditSprint = getPermissions('sprint:update')
  const canDeleteSprint = getPermissions('sprint:delete')
  const canEndSprints = getPermissions('sprint:complete')
  const canSprintsToBacklog = getPermissions('task:backlog')
  const canSprintsToNextSprint = getPermissions('task:next-sprint')
  const canSprintsToNewSprint = getPermissions('task:new-sprint')
  const canMoveTasks = getPermissions('task:state')
  const canAssignTasks = getPermissions('task:assignee')
  const canUpdateTask = getPermissions('task:update')
  const canDeleteTask = getPermissions('task:delete')

  if (!canViewProject || !canViewSprint) {
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
                    {s.sprint_number ?? s.name} ({s.status})
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
              <select
                className="input h-8 !w-auto min-w-[120px] text-xs"
                value={selectedLabelId}
                onChange={(e) => setSelectedLabelId(e.target.value)}
              >
                <option value="">All Labels</option>
                {(taskLabels || []).map((label: any) => (
                  <option key={label.id} value={label.id}>
                    {label.label}
                  </option>
                ))}
              </select>
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
              {canEndSprints && currentSprint?.status === 'active' && (
                <button
                  className="btn-default h-8 px-3 text-xs"
                  onClick={() => setShowEndOptions(true)}
                >
                  End Sprint
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
                    <Droppable droppableId={state.id} key={state.id} isDropDisabled={!canMoveTasks}>
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
                            {(groupedTasks[state.id] || []).map((task: any, index: number) => {
                              const ticketId =
                                task.ticket ||
                                (task.ticket_code && task.ticket_number
                                  ? `${task.ticket_code}-${task.ticket_number}`
                                  : null)
                              return (
                                <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!canMoveTasks}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => setSelectedTask(task)}
                                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="text-xs font-mono text-gray-500">
                                          {ticketId || '—'}
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                      {task.task_label && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          <span
                                            className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                                            style={{
                                              backgroundColor: `${task.task_label.color}15`,
                                              color: task.task_label.color,
                                              borderColor: `${task.task_label.color}30`
                                            }}
                                          >
                                            {task.task_label.label}
                                          </span>
                                        </div>
                                      )}
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
                              )
                            })}
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
                    <div className="md:col-span-1">
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

                    {/* TASK LABEL */}
                    <div className="md:col-span-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Label
                      </label>
                      <select
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                        value={newTask.task_label_id}
                        onChange={(e) =>
                          setNewTask({ ...newTask, task_label_id: e.target.value })
                        }
                      >
                        <option value="">No Label</option>
                        {taskLabels?.map((label: any) => (
                          <option key={label.id} value={label.id}>
                            {label.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700 block">
                          Description
                        </label>
                        <AIRegenerateButton
                          value={newTask.description}
                          onRegenerated={(val) => setNewTask({ ...newTask, description: val })}
                        />
                      </div>
                      <AutoResizingTextarea
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full min-h-[8rem]
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

                    {/* BLOCKED BY TASK */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Blocked by Task
                      </label>
                      <select
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full
                           focus:outline-none focus:border-indigo-600"
                        value={newTask.parent_task_id}
                        onChange={(e) =>
                          setNewTask({ ...newTask, parent_task_id: e.target.value })
                        }
                      >
                        <option value="">None</option>
                        {ticketNumbers && Object.entries(ticketNumbers).map(([tid, ticketNum]) => (
                          <option key={tid} value={tid}>
                            {ticketNum}
                          </option>
                        ))}
                      </select>
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
                            {s.sprint_number ?? s.name} ({s.status})
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
                  </div>
                </section>

                {/* ASSIGNMENT */}
                {canAssignTasks && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                        Assignment
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAssigneeModal(true)}
                        className="flex items-center gap-1 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition"
                      >
                        <Plus className="h-3 w-3" />
                        Add Assignee
                      </button>
                    </div>

                    {/* SELECTED TAGS */}
                    <div className="flex flex-wrap gap-2">
                      {taskAssignees.map((a, i) => {
                        const label =
                          (staffOptions as any[]).find((s) => s.id === a.staff_id)?.name || a.staff_id
                        return (
                          <span
                            key={`${a.staff_id}-${a.role}-${i}`}
                            className="inline-flex items-center gap-1 pl-2 pr-1 py-1 border border-gray-200 bg-gray-50 text-gray-800 text-xs rounded-sm"
                          >
                            <span className="font-medium">{label}</span>
                            <span className="text-gray-400 capitalize mx-1 font-mono text-[10px] leading-tight px-1 bg-white border rounded shadow-sm">{a.role}</span>
                            <button
                              type="button"
                              className="ml-1 text-gray-400 hover:text-gray-900 transition-colors p-0.5"
                              onClick={() => handleRemoveAssignee(a.staff_id, a.role)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })}
                      {taskAssignees.length === 0 && (
                        <span className="text-sm text-gray-500 italic">No assignees selected</span>
                      )}
                    </div>
                  </section>
                )}
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
                    {canSprintsToBacklog && <option value="backlog">Backlog</option>}
                    {canSprintsToNextSprint && <option value="next_sprint">Move to next sprint</option>}
                    {canSprintsToNewSprint && canManageSprints && <option value="new_sprint">Create new sprint and move</option>}
                  </select>
                </div>
                {endMoveOption === 'next_sprint' && (
                  <div>
                    <label className="label">Select Sprint</label>
                    <select className="input" value={endNextSprintId} onChange={(e) => setEndNextSprintId(e.target.value)}>
                      <option value="">Select</option>
                      {(sprints || []).filter((s: any) => (s.status === 'planned' || s.status === 'active') && s.id !== selectedSprintId).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.sprint_number ?? s.name} ({s.status})</option>
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
                      toast.error(getErrorMessage(e, 'Failed to end sprint'))
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
                          setSprintEditMode(false)
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

                {/* RIGHT PANEL */}
                <div className="md:col-span-2">
                  {editingSprint ? (
                    <>
                      {!sprintEditMode && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Sprint Details</h3>
                            <button
                              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100"
                              onClick={() => setSprintEditMode(true)}
                            >
                              Edit
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 border rounded">
                              <div className="text-gray-500">Name</div>
                              <div className="font-medium text-gray-900">{editingSprint.name || '—'}</div>
                            </div>
                            <div className="p-3 border rounded">
                              <div className="text-gray-500">Status</div>
                              <div className="font-medium text-gray-900">{editingSprint.status || '—'}</div>
                            </div>
                            <div className="p-3 border rounded md:col-span-2">
                              <div className="text-gray-500">Goal</div>
                              <div className="font-medium text-gray-900">{editingSprint.goal || '—'}</div>
                            </div>
                            <div className="p-3 border rounded">
                              <div className="text-gray-500">Start Date</div>
                              <div className="font-medium text-gray-900">{editingSprint.start_date || '—'}</div>
                            </div>
                            <div className="p-3 border rounded">
                              <div className="text-gray-500">End Date</div>
                              <div className="font-medium text-gray-900">{editingSprint.end_date || '—'}</div>
                            </div>
                            <div className="p-3 border rounded">
                              <div className="text-gray-500">Capacity</div>
                              <div className="font-medium text-gray-900">{editingSprint.capacity ?? '—'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {sprintEditMode && (
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
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Select a sprint from the list to edit.
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-end gap-3 mt-6">

                    {editingSprint && canDeleteSprint && (
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
                            toast.error(getErrorMessage(e, 'Failed to delete sprint'))
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}

                    {sprintEditMode && (
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 text-sm"
                        onClick={() => {
                          if (editingSprint) {
                            setSprintForm({
                              name: editingSprint.name || "",
                              goal: editingSprint.goal || "",
                              start_date: editingSprint.start_date || "",
                              end_date: editingSprint.end_date || "",
                              status: editingSprint.status || "planned",
                              capacity: editingSprint.capacity ?? ""
                            })
                            setSprintEditMode(true)
                          }
                        }}
                      >
                        Reset
                      </button>
                    )}

                    {editingSprint && sprintEditMode && (
                      <>
                        <button
                          className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                          onClick={async () => {
                            try {
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
                              queryClient.invalidateQueries(["sprints", id])
                              setSprintEditMode(false)
                            } catch (e: any) {
                              toast.error(getErrorMessage(e, 'Failed to save sprint'))
                            }
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          className="px-5 py-2 rounded-md border text-gray-700 bg-white hover:bg-gray-100 text-sm"
                          onClick={() => {
                            if (editingSprint) {
                              setSprintForm({
                                name: editingSprint.name || "",
                                goal: editingSprint.goal || "",
                                start_date: editingSprint.start_date || "",
                                end_date: editingSprint.end_date || "",
                                status: editingSprint.status || "planned",
                                capacity: editingSprint.capacity ?? "",
                              })
                            }
                            setSprintEditMode(false)
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ASSIGNEE MODAL */}
        {showAssigneeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="modal-overlay" onClick={() => setShowAssigneeModal(false)} />
            <div className="modal-content max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Assignee</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Staff Member</label>
                  <select 
                    className="input"
                    value={selectedAssigneeStaffId}
                    onChange={(e) => setSelectedAssigneeStaffId(e.target.value)}
                  >
                    <option value="">Select staff</option>
                    {(staffOptions || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Role</label>
                  <select 
                    className="input"
                    value={selectedAssigneeRole}
                    onChange={(e) => setSelectedAssigneeRole(e.target.value)}
                  >
                    <option value="">Select role</option>
                    {!taskAssignees.some(a => a.role === 'assignee') && (
                      <option value="assignee">Assignee</option>
                    )}
                    <option value="collaborator">Collaborator</option>
                    {!taskAssignees.some(a => a.role === 'reporter') && (
                      <option value="reporter">Reporter</option>
                    )}
                    {!taskAssignees.some(a => a.role === 'tester') && (
                      <option value="tester">Tester</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssigneeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddAssignee}
                  disabled={!selectedAssigneeStaffId || !selectedAssigneeRole}
                >
                  Add
                </button>
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