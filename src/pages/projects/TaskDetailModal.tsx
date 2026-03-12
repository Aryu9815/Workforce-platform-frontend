import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../api/tasks'
import { taskLabelsApi } from '../../api/taskLabelsApi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { showApiError } from '../../lib/utils'
// import { AIRegenerateButton } from '../../components/ui/AIRegenerateButton'
import { AutoResizingTextarea } from '../../components/ui/AutoResizingTextarea'
import { AIRegenerateButton } from '../../components/ui/AIRegenerateButton'


type TaskDetailModalProps = {
  projectId: string
  sprintId: string | null
  workflowStates: any[]
  selectedTask: any
  onClose: () => void
}

type CommentNode = {
  comment: any
  children: CommentNode[]
}

const TaskDetailModal = ({
  projectId,
  sprintId,
  workflowStates,
  selectedTask,
  onClose,
}: TaskDetailModalProps) => {
  const queryClient = useQueryClient()
  const selectedTaskId = selectedTask?.id || null
  const getPermissions = useAuthStore(state => state.getPermissions)
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

  const { data: taskLabels } = useQuery({
    queryKey: ['task-labels', projectId],
    queryFn: () => taskLabelsApi.getTaskLabelsByProject(projectId),
    enabled: !!projectId,
  })

  const [newComment, setNewComment] = useState('')
  const [newCommentInternal, setNewCommentInternal] = useState(false)

  const [editCommentId, setEditCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  const [replyForId, setReplyForId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyInternal, setReplyInternal] = useState(false)

  const [activeTab, setActiveTab] = useState<string>('comments')

  const [taskEditMode, setTaskEditMode] = useState(false)
  const [taskEditData, setTaskEditData] = useState<any>({
    title: '',
    task_label_id: '',
    description: '',
    workflow_state_id: '',
    priority: '',
    estimated_hours: '',
    actual_hours: '',
    due_date: '',
    progress_percentage: '',
    billable: true,
    tags: [],
  })
  const formatDateDisplay = (s?: string) => {
    if (!s) return '—'
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}`
  }

  const buildCommentTree = (list: any[]): CommentNode[] => {
    const nodes: Record<string, CommentNode> = {}
    const roots: CommentNode[] = []
    for (const c of list) {
      nodes[c.id] = { comment: c, children: [] }
    }
    for (const c of list) {
      const parentId = c.parent_comment_id
      if (parentId && nodes[parentId]) {
        nodes[parentId].children.push(nodes[c.id])
      } else {
        roots.push(nodes[c.id])
      }
    }
    return roots
  }
  const canViewComments = getPermissions('comment:view')
  const canEditComments = getPermissions('comment:update')
  const canDeleteComments = getPermissions('comment:delete')
  const canEditTask = getPermissions('task:update')

  const renderCommentNodes = (nodes: CommentNode[], depth = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const c = node.comment
      const offset = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : ''
      const isEditing = editCommentId === c.id
      const isReplying = replyForId === c.id

      return (
        <div key={c.id} className={`space-y-2 ${offset}`}>
          <div className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <div className="relative">
                  <AutoResizingTextarea
                    className="w-full p-2 border rounded text-sm pr-10 min-h-[5rem]"
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                  />
                  <div className="absolute top-2 right-2">
                    <AIRegenerateButton
                      value={editCommentContent}
                      onRegenerated={(val) => setEditCommentContent(val)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 text-xs border rounded"
                    onClick={() => {
                      setEditCommentId(null)
                      setEditCommentContent('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 text-xs bg-teal-700 text-white rounded"
                    onClick={async () => {
                      if (!editCommentContent.trim()) return
                      try {
                        await tasksApi.updateTaskComment(selectedTaskId!, c.id, {
                          content: editCommentContent.trim(),
                        })
                        setEditCommentId(null)
                        setEditCommentContent('')
                        refetchComments()
                        toast.success('Comment updated')
                      } catch (e: any) {
                        showApiError(e, 'Failed to update comment')
                      }
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {c.content || 'deleted'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.is_internal ? (
                      <span className="text-orange-600">Internal</span>
                    ) : (
                      'Public'
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canEditComments && (
                    <button
                      onClick={() => {
                        setEditCommentId(c.id)
                        setEditCommentContent(c.content || '')
                      }}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setReplyForId(c.id)
                      setReplyContent('')
                      setReplyInternal(false)
                    }}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    Reply
                  </button>
                  {canDeleteComments && (
                    <button
                      onClick={async () => {
                        try {
                          await tasksApi.deleteTaskComment(selectedTaskId!, c.id)
                          refetchComments()
                          toast.success('Comment deleted')
                        } catch (e: any) {
                          showApiError(e, 'Failed to delete comment')
                        }
                      }}
                      className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}

            {isReplying && (
              <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-lg border">
                <div className="relative">
                  <AutoResizingTextarea
                    className="w-full p-2 border rounded text-sm pr-10 min-h-[5rem]"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <div className="absolute top-2 right-2">
                    <AIRegenerateButton
                      value={replyContent}
                      onRegenerated={(val) => setReplyContent(val)}
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={replyInternal}
                    onChange={(e) => setReplyInternal(e.target.checked)}
                  />
                  Internal
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 text-xs border rounded"
                    onClick={() => {
                      setReplyForId(null)
                      setReplyContent('')
                      setReplyInternal(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 text-xs bg-teal-700 text-white rounded"
                    onClick={async () => {
                      if (!replyContent.trim()) return
                      try {
                        await tasksApi.addTaskComment(selectedTaskId!, {
                          content: replyContent.trim(),
                          is_internal: replyInternal,
                          parent_comment_id: c.id,
                        })
                        setReplyForId(null)
                        setReplyContent('')
                        setReplyInternal(false)
                        refetchComments()
                        toast.success('Reply added')
                      } catch (e: any) {
                        showApiError(e, 'Failed to add reply')
                      }
                    }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>

          {node.children.length > 0 &&
            renderCommentNodes(node.children, depth + 1)}
        </div>
      )
    })
  }

  if (!selectedTaskId) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content p-0 w-full max-w-4xl flex flex-col h-[90vh]">

        {/* HEADER */}
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="text-xs font-mono text-gray-500">
              {taskDetail?.ticket ||
                (taskDetail?.ticket_code && taskDetail?.ticket_number
                  ? `${taskDetail.ticket_code}-${taskDetail.ticket_number}`
                  : '—')}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              {taskDetail?.title}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-gray-200 rounded-sm p-1 text-gray-500 transition">
            ✕
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN (Main Info, Descriptions, Comments/History) */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">

            {/* DESCRIPTION */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              {taskDetail?.description ? (
                <div className="bg-gray-50 border rounded-lg p-4 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {taskDetail.description}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No description provided.</div>
              )}
            </div>

            {/* TABS (Comments & History) */}
            <div className="mt-8">
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comments' ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
                <button
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  onClick={() => setActiveTab('history')}
                >
                  History Logs
                </button>
              </div>

              {activeTab === 'comments' && (
                <div>
                  {/* NEW COMMENT */}
                  {canViewComments && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-2">
                      <div className="relative">
                        <AutoResizingTextarea
                          className="w-full px-3 py-2 border rounded text-sm pr-10 min-h-[5rem]"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="absolute top-2 right-2">
                          <AIRegenerateButton
                            value={newComment}
                            onRegenerated={(val) => setNewComment(val)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCommentInternal}
                            onChange={(e) => setNewCommentInternal(e.target.checked)}
                          />
                          Internal Note
                        </label>
                        <button
                          className="px-4 py-1.5 bg-teal-700 text-white rounded-md text-sm font-medium hover:bg-teal-800 transition-colors"
                          onClick={async () => {
                            if (!newComment.trim()) return
                            try {
                              await tasksApi.addTaskComment(selectedTaskId!, {
                                content: newComment.trim(),
                                is_internal: newCommentInternal,
                              })
                              setNewComment('')
                              setNewCommentInternal(false)
                              refetchComments()
                              toast.success('Comment added')
                            } catch (e: any) {
                              showApiError(e, 'Failed to add comment')
                            }
                          }}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {taskComments?.length === 0 ? (
                      <div className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg border">No comments yet.</div>
                    ) : (
                      renderCommentNodes(buildCommentTree(taskComments || []))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4 text-sm mt-2">
                  {(taskDetail as any)?.activities?.length ? (
                    (taskDetail as any).activities.map((activity: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-teal-400"></div>

                        <div className="bg-gray-50 p-3 rounded w-full border border-gray-200">
                          <div className="text-gray-800 font-medium">
                            {activity}
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            {formatDateDisplay(taskDetail?.updated_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg border">
                      No history available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Sidebar Details) */}
          <div className="w-[320px] bg-gray-50 overflow-y-auto p-5 shrink-0 border-l border-gray-200">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-900 border-b pb-2">Task Details</h3>
                <div className="flex flex-col gap-3 text-sm">
                  {[
                    ['Ticket', taskDetail?.ticket ||
                      (taskDetail?.ticket_code && taskDetail?.ticket_number
                        ? `${taskDetail.ticket_code}-${taskDetail.ticket_number}`
                        : '—')],
                    ['Label', taskDetail?.task_label?.label || '—'],
                    ['Priority', taskDetail?.priority],
                    ['Estimated Hours', taskDetail?.estimated_hours],
                    ['Estimated Cost', taskDetail?.estimated_cost],
                    ['Actual Hours', taskDetail?.actual_hours],
                    ['Actual Cost', taskDetail?.actual_cost],
                    ['Start Date', taskDetail?.start_date],
                    ['Due Date', taskDetail?.due_date],
                    ['Completed At', formatDateDisplay(taskDetail?.completed_at)],
                    ['Workflow State', taskDetail?.workflow_state_name],
                    ['Progress', `${taskDetail?.progress_percentage ?? 0}%`],
                    ['Milestone', taskDetail?.milestone ? 'Yes' : 'No'],
                    ['Billable', taskDetail?.billable ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white p-3 border rounded-lg">
                      <div className="text-gray-500">{label}</div>
                      <div className="font-medium text-gray-900">{value || '—'}</div>
                    </div>
                  ))}
                </div>

                {taskDetail && (
                  <div className="mt-4">
                    {!taskEditMode && canEditTask && (
                      <div className="flex justify-end">
                        <button
                          className="px-3 py-1 text-xs border rounded hover:bg-gray-100"
                          onClick={() => {
                            setTaskEditData({
                              title: taskDetail.title || '',
                              task_label_id: taskDetail.task_label_id || '',
                              description: taskDetail.description || '',
                              workflow_state_id: taskDetail.workflow_state_id || '',
                              priority: taskDetail.priority || '',
                              estimated_hours: taskDetail.estimated_hours ?? '',
                              actual_hours: taskDetail.actual_hours ?? '',
                              due_date: taskDetail.due_date || '',
                              progress_percentage: taskDetail.progress_percentage ?? '',
                              billable: taskDetail.billable ?? true,
                              tags: taskDetail.tags || [],
                            })
                            setTaskEditMode(true)
                          }}
                        >
                          Edit Task
                        </button>
                      </div>
                    )}

                    {taskEditMode && (
                      <div className="mt-3 border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="sm:col-span-1">
                            <div className="text-gray-700 mb-1">Title</div>
                            <input
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.title}
                              onChange={(e) =>
                                setTaskEditData({ ...taskEditData, title: e.target.value })
                              }
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <div className="text-gray-700 mb-1">Label</div>
                            <select
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.task_label_id}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  task_label_id: e.target.value,
                                })
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
                          <div>
                            <div className="text-gray-700 mb-1">Priority</div>
                            <select
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.priority}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  priority: e.target.value,
                                })
                              }
                            >
                              <option value="">Select</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                          <div>
                            <div className="text-gray-700 mb-1">Workflow State</div>
                            <select
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.workflow_state_id}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  workflow_state_id: e.target.value,
                                })
                              }
                            >
                              <option value="">Select</option>
                              {workflowStates.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-gray-700">Description</div>
                              <AIRegenerateButton
                                value={taskEditData.description}
                                onRegenerated={(val) => setTaskEditData({ ...taskEditData, description: val })}
                              />
                            </div>
                            <AutoResizingTextarea
                              className="w-full px-3 py-2 border rounded text-sm min-h-[5rem]"
                              value={taskEditData.description}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="text-gray-700 mb-1">Estimated Hours</div>
                            <input
                              type="number"
                              step="0.1"
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.estimated_hours}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  estimated_hours: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="text-gray-700 mb-1">Actual Hours</div>
                            <input
                              type="number"
                              step="0.1"
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.actual_hours}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  actual_hours: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="text-gray-700 mb-1">Due Date</div>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.due_date || ''}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  due_date: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="text-gray-700 mb-1">Progress %</div>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={taskEditData.progress_percentage}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  progress_percentage: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!taskEditData.billable}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  billable: e.target.checked,
                                })
                              }
                            />
                            <span className="text-sm text-gray-700">Billable</span>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-gray-700 mb-1">
                              Tags (comma separated)
                            </div>
                            <input
                              className="w-full px-3 py-2 border rounded text-sm"
                              value={(taskEditData.tags || []).join(', ')}
                              onChange={(e) =>
                                setTaskEditData({
                                  ...taskEditData,
                                  tags: e.target.value
                                    .split(',')
                                    .map((t: string) => t.trim()),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            className="px-3 py-1 text-xs border rounded"
                            onClick={() => setTaskEditMode(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-teal-700 text-white rounded"
                            onClick={async () => {
                              try {
                                const payload: any = {
                                  title: taskEditData.title || undefined,
                                  task_label_id: taskEditData.task_label_id || undefined,
                                  description:
                                    taskEditData.description || undefined,
                                  workflow_state_id:
                                    taskEditData.workflow_state_id || undefined,
                                  priority: taskEditData.priority || undefined,
                                  estimated_hours:
                                    taskEditData.estimated_hours !== ''
                                      ? Number(taskEditData.estimated_hours)
                                      : undefined,
                                  actual_hours:
                                    taskEditData.actual_hours !== ''
                                      ? Number(taskEditData.actual_hours)
                                      : undefined,
                                  due_date: taskEditData.due_date || undefined,
                                  completed_at:
                                    taskEditData.completed_at || undefined,
                                  progress_percentage:
                                    taskEditData.progress_percentage !== ''
                                      ? Number(taskEditData.progress_percentage)
                                      : undefined,
                                  billable:
                                    typeof taskEditData.billable === 'boolean'
                                      ? taskEditData.billable
                                      : undefined,
                                  tags:
                                    (taskEditData.tags || []).length
                                      ? taskEditData.tags
                                      : undefined,
                                }
                                await tasksApi.updateTask(
                                  String(selectedTaskId!),
                                  payload
                                )
                                toast.success('Task updated')
                                setTaskEditMode(false)
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    'task',
                                    selectedTaskId,
                                  ]
                                })
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    'tasks',
                                    projectId,
                                    sprintId,
                                  ]
                                })
                              } catch (e: any) {
                                showApiError(e, 'Failed to update task')
                              }
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ASSIGNEES (Sidebar only) */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignees</h3>
                <div className="flex flex-col gap-3">
                  {(!taskDetail?.assignees || taskDetail.assignees.length === 0) ? (
                    <span className="text-gray-500 text-sm italic">Unassigned</span>
                  ) : (
                    taskDetail?.assignees?.map((a: any) => (
                      <div key={a.assignee_id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {a.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                            {a.name}
                            {a.is_primary && <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] uppercase font-bold tracking-wider">Primary</span>}
                          </span>
                          {a.role && (
                            <span className="text-xs text-gray-500 truncate">{a.role}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskDetailModal
