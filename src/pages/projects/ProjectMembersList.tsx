import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { ProjectMember } from '../../types'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getErrorMessage } from '../../lib/utils'

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
      toast.error(getErrorMessage(error, 'Failed to remove member'))
    },
  })

  const getPermissions = useAuthStore(state => state.getPermissions)
  const canManageMembers = getPermissions('project:manage-members')

  return (
    <div className="p-6 space-y-8 bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Project Members</h1>
          <p className="text-sm text-gray-500">All members in this project</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
          >
            Back
          </button>

          {canManageMembers && (
            <Link
              to={`/projects/${id}/members/new`}
              className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 text-sm"
            >
              Add Member
            </Link>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="border bg-white rounded-lg p-6">

        {isLoading ? (
          <p className="text-gray-500 text-center py-8">Loading members...</p>
        ) : !members || members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members yet</p>
        ) : (
          <div className="space-y-3">

            {members.map((m: ProjectMember) => {
              const isActive = !m.left_at

              return (
                <div
                  key={m.id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border transition
                    ${
                      isActive
                        ? 'bg-green-50 border-green-200 text-gray-900'
                        : 'bg-red-50 border-red-200 text-gray-900'
                    }
                  `}
                >
                  {/* Member Name + Role */}
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-600">
                      {m.role || 'Member'}
                    </p>
                  </div>

                  {/* Dates + Actions */}
                  <div className="flex items-center gap-4">

                    <div className="text-right text-xs text-gray-600">
                      <div>
                        Joined:{' '}
                        {m.joined_at
                          ? new Date(m.joined_at).toLocaleDateString()
                          : '—'}
                      </div>
                      {m.left_at && (
                        <div>
                          Left: {new Date(m.left_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Edit */}
                    {canManageMembers && (
                      <button
                        onClick={() => navigate(`/projects/${id}/members/${m.id}/edit`)}
                        className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100"
                      >
                        Edit
                      </button>
                    )}

                    {/* Remove */}
                    {canManageMembers && (
                      <button
                        onClick={() => deleteMutation.mutate(m.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        )}

      </div>
    </div>
  )
}

export default ProjectMembersList
