import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { projectsApi } from '../../api/projects'
import toast from 'react-hot-toast'

const WorkflowSettings = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'transitions' | 'states'>('transitions')
  const [selectedState, setSelectedState] = useState<any | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<any | null>(null)
  const [isStateModalOpen, setIsStateModalOpen] = useState(false)
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false)

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

  const { data: transitions } = useQuery({
    queryKey: ['workflow-transitions', workflowId],
    queryFn: () => projectsApi.getWorkflowTransitions(workflowId!),
    enabled: !!workflowId,
  })

  if (!project || !workflow) {
    return <div className="text-center py-8">Loading...</div>
  }

  const deleteState = async () => {
    if (!selectedState) return
    if (!confirm('Are you sure you want to delete this state?')) return

    try {
      await projectsApi.deleteWorkflowState(workflowId!, selectedState.id)
      toast.success('State deleted')
      queryClient.invalidateQueries(['workflow', workflowId])
      setIsStateModalOpen(false)
      setSelectedState(null)
    } catch {
      toast.error('Failed to delete state')
    }
  }

  const deleteTransition = async () => {
    if (!selectedTransition) return
    if (!confirm('Are you sure you want to delete this transition?')) return

    try {
      await projectsApi.deleteWorkflowTransition(workflowId!, selectedTransition.id)
      toast.success('Transition deleted')
      queryClient.invalidateQueries(['workflow-transitions', workflowId])
      setIsTransitionModalOpen(false)
      setSelectedTransition(null)
    } catch {
      toast.error('Failed to delete transition')
    }
  }

  /* ================== SAVE FUNCTIONS ================== */

  const saveState = async (data: any) => {
    try {
      // Add work_flow_id if required
      data.workflow_id = workflowId!
      if (selectedState) {
        await projectsApi.updateWorkflowState(workflowId!, selectedState.id, data)  
        toast.success('State updated')
      } else {
        await projectsApi.createWorkflowState(workflowId!, data)
        toast.success('State created')
      }

      queryClient.invalidateQueries(['workflow', workflowId])
      setIsStateModalOpen(false)
      setSelectedState(null)
    } catch (e) {
      toast.error('Failed to save state')
    }
  }

  const saveTransition = async (data: any) => {
    try {
      // Add work_flow_id if required
      data.workflow_id = workflowId!
      if (selectedTransition) {
        await projectsApi.updateWorkflowTransition(workflowId!, selectedTransition.id, data)
        toast.success('Transition updated')
      } else {
        await projectsApi.createWorkflowTransition(workflowId!, data)
        toast.success('Transition created')
      }

      queryClient.invalidateQueries(['workflow-transitions', workflowId])
      setIsTransitionModalOpen(false)
      setSelectedTransition(null)
    } catch (e) {
      toast.error('Failed to save transition')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Workflow Settings</h1>
          <p className="page-description">{project.name}</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate(`/projects/${id}/workflow`)}
        >
          Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        <button
          onClick={() => setActiveTab('transitions')}
          className={`px-4 py-2 ${activeTab === 'transitions' ? 'font-bold border-b-2 border-primary-600' : ''}`}
        >
          Transitions
        </button>
        <button
          onClick={() => setActiveTab('states')}
          className={`px-4 py-2 ${activeTab === 'states' ? 'font-bold border-b-2 border-primary-600' : ''}`}
        >
          States
        </button>
      </div>

      <div className="card">
        <div className="card-body">

          {/* ================= TRANSITIONS ================= */}
          {activeTab === 'transitions' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedTransition(null)
                    setIsTransitionModalOpen(true)
                  }}
                >
                  + Add Transition
                </button>
              </div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary-50">
                    <th className="p-3 border">From</th>
                    <th className="p-3 border">To</th>
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Description</th>
                    <th className="p-3 border">Approval</th>
                    <th className="p-3 border">Auto</th>
                  </tr>
                </thead>
                <tbody>
                  {(transitions?.items || transitions || []).map((tr: any) => (
                    <tr
                      key={tr.id}
                      className="hover:bg-secondary-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransition(tr)
                        setIsTransitionModalOpen(true)
                      }}
                    >
                      <td className="p-3 border">{tr.from_state_name}</td>
                      <td className="p-3 border">{tr.to_state_name}</td>
                      <td className="p-3 border">{tr.name}</td>
                      <td className="p-3 border">{tr.description || '-'}</td>
                      <td className="p-3 border text-center">
                        {tr.request_approval ? 'Yes' : 'No'}
                      </td>
                      <td className="p-3 border text-center">
                        {tr.auto_transition ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ================= STATES ================= */}
          {activeTab === 'states' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedState(null)
                    setIsStateModalOpen(true)
                  }}
                >
                  + Add State
                </button>
              </div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary-50">
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Order</th>
                    <th className="p-3 border">Initial</th>
                    <th className="p-3 border">Final</th>
                    <th className="p-3 border">Category</th>
                    <th className="p-3 border">Time Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {workflow.workflow_states.map((st: any) => (
                    <tr
                      key={st.id}
                      className="hover:bg-secondary-50 cursor-pointer"
                      onClick={() => {
                        setSelectedState(st)
                        setIsStateModalOpen(true)
                      }}
                    >
                      <td className="p-3 border">{st.name}</td>
                      <td className="p-3 border">{st.order_index}</td>
                      <td className="p-3 border text-center">{st.is_initial ? 'Yes' : 'No'}</td>
                      <td className="p-3 border text-center">{st.is_final ? 'Yes' : 'No'}</td>
                      <td className="p-3 border">{st.category || '-'}</td>
                      <td className="p-3 border text-center">{st.time_limit_hours ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        </div>
      </div>

      {/* ================= MODALS ================= */}

      {isStateModalOpen && (
        <StateModal
          stateData={selectedState}
          onClose={() => setIsStateModalOpen(false)}
          onSave={saveState}
          onDelete={deleteState}
        />
      )}

      {isTransitionModalOpen && (
        <TransitionModal
          transitionData={selectedTransition}
          workflowStates={workflow.workflow_states}
          onClose={() => setIsTransitionModalOpen(false)}
          onSave={saveTransition}
          onDelete={deleteTransition}
        />
      )}

    </div>
  )
}

export default WorkflowSettings

const StateModal = ({ stateData, onClose, onSave, onDelete }: any) => {
  const [form, setForm] = useState({
    name: stateData?.name || '',
    description: stateData?.description || '',
    order_index: stateData?.order_index || 0,
    is_initial: stateData?.is_initial || false,
    is_final: stateData?.is_final || false,
    category: stateData?.category || '',
    requires_assignment: stateData?.requires_assignment || false,
    time_limit_hours: stateData?.time_limit_hours || '',
    color: stateData?.color || '#cccccc',
  })

  return (
    <Modal onClose={onClose} title={stateData ? 'Edit State' : 'Create State'}>
      <div className="space-y-3">
        <input className="input" placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <textarea className="input" placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />

        <input className="input" type="number" placeholder="Order"
          value={form.order_index}
          onChange={e => setForm({ ...form, order_index: Number(e.target.value) })} />

        <label>
          <input type="checkbox"
            checked={form.is_initial}
            onChange={e => setForm({ ...form, is_initial: e.target.checked })} />
          Initial
        </label>

        <label>
          <input type="checkbox"
            checked={form.is_final}
            onChange={e => setForm({ ...form, is_final: e.target.checked })} />
          Final
        </label>

        <input className="input" placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })} />

        <input className="input" type="number" placeholder="Time Limit (hrs)"
          value={form.time_limit_hours}
          onChange={e => setForm({ ...form, time_limit_hours: Number(e.target.value) })} />

        <input type="color"
          value={form.color}
          onChange={e => setForm({ ...form, color: e.target.value })} />

        <div className="flex justify-between gap-3 pt-4">
          {stateData && (
            <button
              className="btn-danger"
              onClick={onDelete}
            >
              Delete
            </button>
          )}

          <button
            className="btn-primary flex-1"
            onClick={() => onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}

const TransitionModal = ({ transitionData, workflowStates, onClose, onSave, onDelete }: any) => {
  const [form, setForm] = useState({
    from_state_id: transitionData?.from_state_id || '',
    to_state_id: transitionData?.to_state_id || '',
    name: transitionData?.name || '',
    description: transitionData?.description || '',
    request_approval: transitionData?.request_approval || false,
    auto_transition: transitionData?.auto_transition || false,
  })

  return (
    <Modal onClose={onClose} title={transitionData ? 'Edit Transition' : 'Create Transition'}>
      <div className="space-y-3">

        <select className="input"
          value={form.from_state_id}
          onChange={e => setForm({ ...form, from_state_id: e.target.value })}>
          <option value="">From State</option>
          {workflowStates.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select className="input"
          value={form.to_state_id}
          onChange={e => setForm({ ...form, to_state_id: e.target.value })}>
          <option value="">To State</option>
          {workflowStates.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input className="input" placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <textarea className="input" placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />

        <label>
          <input type="checkbox"
            checked={form.request_approval}
            onChange={e => setForm({ ...form, request_approval: e.target.checked })} />
          Requires Approval
        </label>

        <label>
          <input type="checkbox"
            checked={form.auto_transition}
            onChange={e => setForm({ ...form, auto_transition: e.target.checked })} />
          Auto Transition
        </label>

        <div className="flex justify-between gap-3 pt-4">
          {transitionData && (
            <button
              className="btn-danger"
              onClick={onDelete}
            >
              Delete
            </button>
          )}

          <button
            className="btn-primary flex-1"
            onClick={() => onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}

const Modal = ({ children, onClose, title }: any) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <button onClick={onClose}>X</button>
      </div>
      {children}
    </div>
  </div>
)
