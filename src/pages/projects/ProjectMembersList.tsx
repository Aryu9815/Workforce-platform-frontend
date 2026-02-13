import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { ProjectMember } from '../../types'
import { Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ProjectMembersList = () => {
  const { id } = useParams<{ id: string }>()

  const navigate = useNavigate()
  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => projectsApi.getProjectMembers(id!),
    enabled: !!id,
  })
  
  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => projectsApi.deleteProjectMember(memberId),
    onSuccess: () => {
      toast.success('Member removed')
      refetch()
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to remove member'
      toast.error(message)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Project Members</h1>
          <p className="page-description">All members in this project</p>
        </div>
        <Link to={`/projects/${id}/members/new`} className="btn-primary">
          Add Member
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <p className="text-center py-8">Loading...</p>
          ) : !members || members.length === 0 ? (
            <p className="text-center py-8 text-secondary-500">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map((m: ProjectMember) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${m.left_at ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{m.name}</p>
                    <p className="text-xs text-secondary-600">{m.role || 'Member'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary-500 space-y-1 text-right">
                      <div>Joined: {m.joined_at ? new Date(m.joined_at).toLocaleString() : '—'}</div>
                      {m.left_at && <div>Left: {new Date(m.left_at).toLocaleString()}</div>}
                    </div>
                    <button
                      className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-700"
                      onClick={() => navigate(`/projects/${id}/members/${m.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-secondary-100 text-danger-600"
                      onClick={() => deleteMutation.mutate(m.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectMembersList
