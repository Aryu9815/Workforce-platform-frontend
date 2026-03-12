import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { taskLabelsApi } from '../../api/taskLabelsApi'
import { projectsApi } from '../../api/projects'
import { TaskLabel, TaskLabelCreate, TaskLabelUpdate } from '../../types'
import TaskLabelForm from '../../components/task-labels/TaskLabelForm'
import { getErrorMessage } from '../../lib/utils'
import toast from 'react-hot-toast'

const TaskLabelList = () => {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<TaskLabel | null>(null)

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 1, page_size: 100 }), // Assuming max 1000 projects
  })

  const { data: labelsData, isLoading: isLoadingLabels } = useQuery({
    queryKey: ['task-labels', selectedProjectId],
    queryFn: () => taskLabelsApi.getTaskLabels({ project_id: selectedProjectId, page_size: 100 }),
    enabled: !!selectedProjectId,
  })

  const createLabelMutation = useMutation({
    mutationFn: (data: TaskLabelCreate) => taskLabelsApi.createTaskLabel(data),
    onSuccess: () => {
      toast.success('Label created successfully')
      queryClient.invalidateQueries({ queryKey: ['task-labels', selectedProjectId] })
      setShowModal(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create label'))
    },
  })

  const updateLabelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskLabelUpdate }) =>
      taskLabelsApi.updateTaskLabel(id, data),
    onSuccess: () => {
      toast.success('Label updated successfully')
      queryClient.invalidateQueries({ queryKey: ['task-labels', selectedProjectId] })
      setShowModal(false)
      setSelectedLabel(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update label'))
    },
  })

  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => taskLabelsApi.deleteTaskLabel(id),
    onSuccess: () => {
      toast.success('Label deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['task-labels', selectedProjectId] })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete label'))
    },
  })

  const handleFormSubmit = (data: TaskLabelUpdate) => {
    if (selectedLabel) {
      updateLabelMutation.mutate({ id: selectedLabel.id, data })
    } else {
      createLabelMutation.mutate({ ...data, project_id: selectedProjectId })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this label?')) {
      deleteLabelMutation.mutate(id)
    }
  }

  const openModal = (label: TaskLabel | null = null) => {
    setSelectedLabel(label)
    setShowModal(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Task Labels</h1>
          <p className="text-sm text-gray-500">Manage labels for your projects</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoadingProjects}
          >
            <option value="">{isLoadingProjects ? 'Loading projects...' : 'Select a project'}</option>
            {projectsData?.items.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center"
            disabled={!selectedProjectId}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Label
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingLabels ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading labels...</td></tr>
              ) : !selectedProjectId ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Please select a project to see the labels.</td></tr>
              ) : labelsData?.items.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No labels found for this project.</td></tr>
              ) : (
                labelsData?.items.map((label: TaskLabel) => (
                  <tr key={label.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{ backgroundColor: `${label.color}33`, color: label.color }}
                      >
                        {label.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{label.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(label)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(label.id)} className="text-red-600 hover:text-red-900 ml-4"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{selectedLabel ? 'Edit' : 'Create'} Task Label</h2>
            <TaskLabelForm
              initialData={selectedLabel}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowModal(false)}
              isSubmitting={createLabelMutation.isPending || updateLabelMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskLabelList