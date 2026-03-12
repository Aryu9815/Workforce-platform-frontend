import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { projectsApi } from "../../api/projects"
import { taskLabelsApi } from "../../api/taskLabelsApi"
import toast from "react-hot-toast"
import { useAuthStore } from '../../store/authStore'
import { getErrorMessage } from '../../lib/utils'

const WorkflowSettings = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<"transitions" | "states" | "labels">("transitions")
  const [selectedState, setSelectedState] = useState<any | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<any | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<any | null>(null)
  const [isStateModalOpen, setIsStateModalOpen] = useState(false)
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false)
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)

  const getPermissions = useAuthStore(state => state.getPermissions)
  const canViewTransitions = getPermissions('transition:view')
  const canViewStates = getPermissions('state:view')
  const canViewLabels = getPermissions('task_label:view')
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })

  const workflowId = project?.workflow_id

  const { data: workflow } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => projectsApi.getWorkflow(workflowId!),
    enabled: !!workflowId,
  })

  const { data: transitions } = useQuery({
    queryKey: ["workflow-transitions", workflowId],
    queryFn: () => projectsApi.getWorkflowTransitions(workflowId!),
    enabled: !!workflowId,
  })

  const { data: labels } = useQuery({
    queryKey: ["task-labels", id],
    queryFn: () => taskLabelsApi.getTaskLabelsByProject(id!),
    enabled: !!id,
  })

  if (!project || !workflow) {
    return <div className="py-10 text-center text-gray-500">Loading...</div>
  }
  if (!canViewStates && !canViewTransitions) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view states and transitions.</p>
      </div>
    )
  }
  const saveState = async (data: any) => {
    try {
      data.workflow_id = workflowId
      if (selectedState) {
        await projectsApi.updateWorkflowState(workflowId!, selectedState.id, data)
        toast.success("State updated")
      } else {
        await projectsApi.createWorkflowState(workflowId!, data)
        toast.success("State created")
      }

      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] })
      setIsStateModalOpen(false)
      setSelectedState(null)
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save state"))
    }
  }

  const saveTransition = async (data: any) => {
    try {
      data.workflow_id = workflowId
      if (selectedTransition) {
        await projectsApi.updateWorkflowTransition(workflowId!, selectedTransition.id, data)
        toast.success("Transition updated")
      } else {
        await projectsApi.createWorkflowTransition(workflowId!, data)
        toast.success("Transition created")
      }

      queryClient.invalidateQueries({ queryKey: ["workflow-transitions", workflowId] })
      setIsTransitionModalOpen(false)
      setSelectedTransition(null)
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save transition"))
    }
  }

  const saveLabel = async (data: any) => {
    try {
      if (selectedLabel) {
        await taskLabelsApi.updateTaskLabel(selectedLabel.id, data)
        toast.success("Label updated")
      } else {
        await taskLabelsApi.createTaskLabel({ ...data, project_id: id! })
        toast.success("Label created")
      }

      queryClient.invalidateQueries({ queryKey: ["task-labels", id] })
      setIsLabelModalOpen(false)
      setSelectedLabel(null)
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save label"))
    }
  }

  const deleteState = async () => {
    if (!selectedState) return
    if (!confirm("Delete this state?")) return

    await projectsApi.deleteWorkflowState(workflowId!, selectedState.id)
    queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] })
    setIsStateModalOpen(false)
    setSelectedState(null)
    toast.success("State removed")
  }

  const deleteTransition = async () => {
    if (!selectedTransition) return
    if (!confirm("Delete this transition?")) return

    await projectsApi.deleteWorkflowTransition(workflowId!, selectedTransition.id)
    queryClient.invalidateQueries({ queryKey: ["workflow-transitions", workflowId] })
    setIsTransitionModalOpen(false)
    setSelectedTransition(null)
    toast.success("Transition removed")
  }

  const deleteLabel = async () => {
    if (!selectedLabel) return
    if (!confirm("Delete this label?")) return

    await taskLabelsApi.deleteTaskLabel(selectedLabel.id)
    queryClient.invalidateQueries({ queryKey: ["task-labels", id] })
    setIsLabelModalOpen(false)
    setSelectedLabel(null)
    toast.success("Label removed")
  }

  const canEditState = getPermissions('state:update')
  const canEditTransition = getPermissions('transition:update')
  const canEditLabel = getPermissions('task_label:update')
  const canDeleteState = getPermissions('state:delete')
  const canDeleteTransition = getPermissions('transition:delete')
  const canDeleteLabel = getPermissions('task_label:delete')
  const canCreateState = getPermissions('state:create')
  const canCreateTransition = getPermissions('transition:create')
  const canCreateLabel = getPermissions('task_label:create')


  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Workflow Settings</h1>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>

        <button
          className="px-4 py-2 text-sm border rounded-md bg-white hover:bg-gray-100"
          onClick={() => navigate(`/projects/${id}/workflow`)}
        >
          Back
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-white p-1 border border-gray-200 rounded-md w-fit gap-1">
        {canViewTransitions && (
        <button
          onClick={() => setActiveTab("transitions")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "transitions"
              ? "bg-teal-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Transitions
        </button>
        )}
        {canViewStates && (
        <button
          onClick={() => setActiveTab("states")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "states"
              ? "bg-teal-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          States
        </button>
        )}
        {canViewLabels && (
        <button
          onClick={() => setActiveTab("labels")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "labels"
              ? "bg-teal-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Labels
        </button>
        )}
        </div>

      <div className="border border-gray-200 rounded-md bg-white p-6">

        {/* TRANSITIONS */}
        {activeTab === "transitions" && (
          <>
            <div className="flex justify-end mb-4">
              {canCreateTransition && (
              <button
                onClick={() => {
                  setSelectedTransition(null)
                  setIsTransitionModalOpen(true)
                }}
                className="btn-primary"
              >
                + Add Transition
              </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">From</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">To</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Description</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Approval</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Auto</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {(transitions?.items || transitions || []).map((tr: any) => (
                    <tr
                      key={tr.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (!canEditTransition) return
                        setSelectedTransition(tr)
                        setIsTransitionModalOpen(true)
                      }}
                    >
                      <td className="px-4 py-3">{tr.from_state_name}</td>
                      <td className="px-4 py-3">{tr.to_state_name}</td>
                      <td className="px-4 py-3">{tr.name}</td>
                      <td className="px-4 py-3">{tr.description || "-"}</td>
                      <td className="px-4 py-3 text-center">{tr.request_approval ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-center">{tr.auto_transition ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* STATES */}
        {activeTab === "states" && (
          <>
            <div className="flex justify-end mb-4">
              {canCreateState && (
              <button
                onClick={() => {
                  setSelectedState(null)
                  setIsStateModalOpen(true)
                }}
                className="px-4 py-2 text-sm bg-teal-700 text-white rounded-md hover:bg-teal-800"
              >
                + Add State
              </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Order</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Initial</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Final</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Category</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Time Limit</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {workflow.workflow_states.map((st: any) => (
                    <tr
                      key={st.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (!canEditState) return
                        setSelectedState(st)
                        setIsStateModalOpen(true)
                      }}
                    >
                      <td className="px-4 py-3">{st.name}</td>
                      <td className="px-4 py-3">{st.order_index}</td>
                      <td className="px-4 py-3 text-center">{st.is_initial ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-center">{st.is_final ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{st.category || "-"}</td>
                      <td className="px-4 py-3 text-center">{st.time_limit_hours ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LABELS */}
        {activeTab === "labels" && (
          <>
            <div className="flex justify-end mb-4">
              {canCreateLabel && (
              <button
                onClick={() => {
                  setSelectedLabel(null)
                  setIsLabelModalOpen(true)
                }}
                className="px-4 py-2 text-sm bg-teal-700 text-white rounded-md hover:bg-teal-800"
              >
                + Add Label
              </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Label</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Description</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-medium">Color</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {labels?.map((label: any) => (
                    <tr
                      key={label.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (!canEditLabel) return
                        setSelectedLabel(label)
                        setIsLabelModalOpen(true)
                      }}
                    >
                      <td className="px-4 py-3 font-medium">{label.label}</td>
                      <td className="px-4 py-3">{label.description || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="font-mono text-xs">{label.color}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* MODALS (will update theme next) */}
      {isStateModalOpen && (
        <StateModal
          stateData={selectedState}
          onClose={() => setIsStateModalOpen(false)}
          onSave={saveState}
          onDelete={canDeleteState ? deleteState : undefined}
        />
      )}

      {isTransitionModalOpen && (
        <TransitionModal
          transitionData={selectedTransition}
          workflowStates={workflow.workflow_states}
          onClose={() => setIsTransitionModalOpen(false)}
          onSave={saveTransition}
          onDelete={canDeleteTransition ? deleteTransition : undefined}
        />
      )}

      {isLabelModalOpen && (
        <LabelModal
          labelData={selectedLabel}
          onClose={() => setIsLabelModalOpen(false)}
          onSave={saveLabel}
          onDelete={canDeleteLabel ? deleteLabel : undefined}
        />
      )}

    </div>
  )
}

export default WorkflowSettings

/* ---------------------------------------------------------
   SHARED STYLES
--------------------------------------------------------- */

const inputClass = "input"
const labelClass = "label"


/* ---------------------------------------------------------
   BASE MODAL COMPONENT (Indigo Theme)
--------------------------------------------------------- */

const Modal = ({ title, children, onClose }: any) => (
  <>
    <div className="modal-overlay" onClick={onClose} />
    <div className="modal-content p-0 max-w-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm transition"
        >
          Close
        </button>
      </div>
      {/* Content */}
      <div className="px-6 py-5">{children}</div>
    </div>
  </>
)


/* ---------------------------------------------------------
   STATE MODAL (Indigo Theme)
--------------------------------------------------------- */

export const StateModal = ({ stateData, onClose, onSave, onDelete }: any) => {
  const [form, setForm] = useState({
    name: stateData?.name || "",
    description: stateData?.description || "",
    order_index: stateData?.order_index || 0,
    is_initial: stateData?.is_initial || false,
    is_final: stateData?.is_final || false,
    category: stateData?.category || "",
    requires_assignment: stateData?.requires_assignment || false,
    time_limit_hours: stateData?.time_limit_hours || "",
    color: stateData?.color || "#cccccc",
  })

  return (
    <Modal title={stateData ? "Edit State" : "Create State"} onClose={onClose}>
      <div className="space-y-4">

        {/* Name */}
        <div>
          <label className={labelClass}>State Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className={inputClass}
            rows={3}
          />
        </div>

        {/* Order */}
        <div>
          <label className={labelClass}>Order Index</label>
          <input
            type="number"
            value={form.order_index}
            onChange={(e) =>
              setForm({ ...form, order_index: Number(e.target.value) })
            }
            className={inputClass}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_initial}
              onChange={(e) =>
                setForm({ ...form, is_initial: e.target.checked })
              }
              className="h-4 w-4"
            />
            Initial State
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_final}
              onChange={(e) =>
                setForm({ ...form, is_final: e.target.checked })
              }
              className="h-4 w-4"
            />
            Final State
          </label>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Time Limit */}
        <div>
          <label className={labelClass}>Time Limit (Hours)</label>
          <input
            type="number"
            value={form.time_limit_hours}
            onChange={(e) =>
              setForm({
                ...form,
                time_limit_hours: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        {/* Color */}
        <div>
          <label className={labelClass}>Color</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-10 w-20 rounded"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">

          {stateData && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-sm"
            >
              Delete
            </button>
          )}

          <button
            onClick={() => onSave(form)}
            className="ml-auto btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}


export const LabelModal = ({ labelData, onClose, onSave, onDelete }: any) => {
  const [form, setForm] = useState({
    label: labelData?.label || "",
    description: labelData?.description || "",
    color: labelData?.color || "#CCCCCC",
  })

  return (
    <Modal title={labelData ? "Edit Label" : "Create Label"} onClose={onClose}>
      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className={labelClass}>Label Name</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className={inputClass}
            rows={3}
          />
        </div>

        {/* Color */}
        <div>
          <label className={labelClass}>Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
          {labelData && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-sm"
            >
              Delete
            </button>
          )}

          <button
            onClick={() => onSave(form)}
            className="ml-auto btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}


/* ---------------------------------------------------------
   TRANSITION MODAL (Indigo Theme)
--------------------------------------------------------- */

export const TransitionModal = ({
  transitionData,
  workflowStates,
  onSave,
  onClose,
  onDelete,
}: any) => {
  const [form, setForm] = useState({
    from_state_id: transitionData?.from_state_id || "",
    to_state_id: transitionData?.to_state_id || "",
    name: transitionData?.name || "",
    description: transitionData?.description || "",
    request_approval: transitionData?.request_approval || false,
    auto_transition: transitionData?.auto_transition || false,
  })

  return (
    <Modal
      title={transitionData ? "Edit Transition" : "Create Transition"}
      onClose={onClose}
    >
      <div className="space-y-4">

        {/* FROM */}
        <div>
          <label className={labelClass}>From State</label>
          <select
            value={form.from_state_id}
            onChange={(e) =>
              setForm({ ...form, from_state_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Select...</option>
            {workflowStates.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* TO */}
        <div>
          <label className={labelClass}>To State</label>
          <select
            value={form.to_state_id}
            onChange={(e) =>
              setForm({ ...form, to_state_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Select...</option>
            {workflowStates.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Transition Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className={inputClass}
            rows={3}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.request_approval}
              onChange={(e) =>
                setForm({
                  ...form,
                  request_approval: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Requires Approval
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.auto_transition}
              onChange={(e) =>
                setForm({
                  ...form,
                  auto_transition: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
            Auto Transition
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
          {transitionData && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-sm"
            >
              Delete
            </button>
          )}

          <button
            onClick={() => onSave(form)}
            className="ml-auto btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
