import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react'
import { projectsApi } from '../../api/projects'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: !!id,
  })
  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(id!),
    onSuccess: () => {
      toast.success('Project deleted')
      navigate('/projects')
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete project'
      toast.error(message)
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }
  
  if (!project) {
    return <div className="text-center py-8">Project not found</div>
  }
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'badge-default',
      active: 'badge-success',
      on_hold: 'badge-warning',
      completed: 'badge-info',
    }
    return <span className={styles[status] || 'badge-default'}>{status.replace('_', ' ')}</span>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/projects')}
            className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="page-title">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            {project.code && <p className="page-description">{project.code}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button 
            className="btn-default"
            onClick={() => navigate(`/projects/${id}/workflow`)}
          >
            My Task
          </button>
          <button 
            className="btn-danger" 
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending} 
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Project info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Overview</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary-700">{project.description || 'No description provided.'}</p>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">Progress</span>
                  <span className="text-sm text-secondary-500">{project.progress_percentage}%</span>
                </div>
                <div className="h-3 bg-secondary-200 rounded-full">
                  <div
                    className="h-3 bg-primary-600 rounded-full transition-all"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tasks placeholder */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Recent Tasks</h3>
            </div>
            <div className="card-body">
              <p className="text-secondary-500 text-center py-4">No tasks yet</p>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm text-secondary-500">Project Manager</p>
                  <p className="text-sm font-medium text-secondary-900">{project.manager_name || 'Not assigned'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm text-secondary-500">Timeline</p>
                  <p className="text-sm font-medium text-secondary-900">
                    {project.start_date ? (
                      <>
                        {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
                      </>
                    ) : (
                      'Not scheduled'
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm text-secondary-500">Budget</p>
                  <p className="text-sm font-medium text-secondary-900">
                    {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Team members placeholder */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-secondary-900">Team Members</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/projects/${id}/members/new`)}
                    className="btn-secondary"
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${id}/members`)}
                    className="btn-primary"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {project.project_members && project.project_members.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {project.project_members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => navigate(`/staff/${member.staff_id}`)}
                      className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-secondary-900">{member.name}</p>
                      <p className="text-xs text-secondary-600">{member.role}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500 text-center py-4">No team members</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
