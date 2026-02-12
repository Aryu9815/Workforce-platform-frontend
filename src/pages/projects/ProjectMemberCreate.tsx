import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ProjectMemberCreate = () => {
  const navigate = useNavigate()
  const { id, memberId } = useParams<{ id: string; memberId?: string }>()
  const isEdit = !!memberId

  const [search, setSearch] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [role, setRole] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [leftAt, setLeftAt] = useState('')

  const { data: staffNames, isLoading } = useQuery({
    queryKey: ['staff-names'],
    queryFn: staffApi.getStaffNames,
  })

  const staffOptions =
    Array.isArray(staffNames)
      ? staffNames.map((s: any) => ({ id: s.id, name: s.name }))
      : staffNames
      ? Object.entries(staffNames).map(([id, name]) => ({ id, name: String(name) }))
      : []

  const { data: existingMember } = useQuery({
    queryKey: ['project-member', memberId],
    queryFn: () => projectsApi.getProjectMember(memberId!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existingMember) {
      setRole(existingMember.role || '')
      setJoinedAt(existingMember.joined_at || '')
      setSearch(existingMember.name || '')
      setSelectedStaffId(existingMember.staff_id || '')
    }
  }, [existingMember])

  const createMutation = useMutation({
    mutationFn: (payload: { project_id: string; staff_id: string; role?: string; joined_at?: string }) =>
      projectsApi.addProjectMember(payload),
    onSuccess: () => {
      toast.success('Member added')
      navigate(`/projects/${id}/members`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add member'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { role?: string; joined_at?: string; left_at?: string }) =>
      projectsApi.updateProjectMember(memberId!, payload),
    onSuccess: () => {
      toast.success('Member updated')
      navigate(`/projects/${id}/members`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update member'
      toast.error(message)
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate({
        role: role || undefined,
        joined_at: joinedAt || undefined,
        left_at: leftAt || undefined,
      })
    } else {
      if (!selectedStaffId) return
      createMutation.mutate({
        project_id: id!,
        staff_id: selectedStaffId,
        role: role || undefined,
        joined_at: joinedAt || undefined,
      })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">{isEdit ? 'Edit Project Member' : 'Add Project Member'}</h1>
        <p className="page-description">
          {isEdit ? 'Update role and dates for this member' : 'Add a staff member to this project'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isEdit && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Staff
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder={isLoading ? 'Loading staff...' : 'Search staff by name'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                disabled={isLoading}
              />
              {staffOptions && (
                <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-secondary-200 bg-white">
                  {staffOptions
                    .filter(({ name }) =>
                      search ? name.toLowerCase().includes(search.toLowerCase()) : true
                    )
                    .slice(0, 50)
                    .map(({ id, name }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(id)
                          setSearch(name)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-secondary-100 ${
                          selectedStaffId === id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <span className="text-sm text-secondary-900">{name}</span>
                        <span className="ml-2 text-xs text-secondary-500">{id}</span>
                      </button>
                    ))}
                  {staffOptions && staffOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-secondary-500">
                      No staff found
                    </div>
                  )}
                </div>
              )}
              {selectedStaffId && (
                <p className="mt-2 text-xs text-secondary-600">
                  Selected ID: {selectedStaffId}
                </p>
              )}
            </div>
          </div>
          )}

          <input
            name="role"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
          />

          <input
            name="joined_at"
            type="datetime-local"
            value={joinedAt}
            onChange={(e) => setJoinedAt(e.target.value)}
            className="input"
          />

          {isEdit && (
            <input
              name="left_at"
              type="datetime-local"
              value={leftAt}
              onChange={(e) => setLeftAt(e.target.value)}
              className="input"
            />
          )}
        </div>

        <div className="card-footer flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/projects/${id}/members`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              (isEdit ? updateMutation.isPending : createMutation.isPending) ||
              (!isEdit && !selectedStaffId)
            }
            className="btn-primary"
          >
            {isEdit
              ? updateMutation.isPending
                ? 'Updating...'
                : 'Update Member'
              : createMutation.isPending
              ? 'Adding...'
              : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectMemberCreate
