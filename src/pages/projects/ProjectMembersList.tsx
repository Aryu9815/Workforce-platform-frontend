import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { ProjectMember } from '../../types'

const ProjectMembersList = () => {
  const { id } = useParams<{ id: string }>()

  const { data: members, isLoading } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => projectsApi.getProjectMembers(id!),
    enabled: !!id,
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
                  <div className="text-xs text-secondary-500 space-y-1 text-right">
                    <div>Joined: {m.joined_at ? new Date(m.joined_at).toLocaleString() : '—'}</div>
                    {m.left_at && <div>Left: {new Date(m.left_at).toLocaleString()}</div>}
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
