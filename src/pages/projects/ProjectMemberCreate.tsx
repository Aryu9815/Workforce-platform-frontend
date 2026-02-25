import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import { useAuthStore } from '../../store/authStore'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../lib/utils'

const inputClass =
  "border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
const labelClass = "text-sm font-medium text-gray-700"

const ProjectMemberCreate = () => {
  const navigate = useNavigate()
  const { id, memberId } = useParams<{ id: string; memberId?: string }>()
  const isEdit = !!memberId
  const getPermissions = useAuthStore(state => state.getPermissions)

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
      toast.error(getErrorMessage(error, 'Failed to add member'))
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
      toast.error(getErrorMessage(error, 'Failed to update member'))
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

  const canManageMembers = getPermissions('project:manage-members')

  if (!canManageMembers) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to manage project members.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Edit Project Member' : 'Add Project Member'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isEdit ? 'Update member details' : 'Add a staff member to this project'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* STAFF SEARCH */}
          {!isEdit && (
            <div className="md:col-span-2">
              <label className={labelClass}>Staff Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={search}
                  disabled={isLoading}
                  placeholder={isLoading ? 'Loading staff...' : 'Search staff...'}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputClass} pl-10`}
                />

                {/* Suggestions */}
                {search && staffOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-56 overflow-y-auto">
                    {staffOptions
                      .filter(({ name }) =>
                        search ? name.toLowerCase().includes(search.toLowerCase()) : true
                      )
                      .slice(0, 40)
                      .map(({ id, name }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(id)
                            setSearch(name)
                          }}
                          className={`w-full flex justify-between px-3 py-2 text-left hover:bg-indigo-50 ${
                            selectedStaffId === id ? 'bg-indigo-100' : ''
                          }`}
                        >
                          <span className="text-sm text-gray-800">{name}</span>
                          <span className="text-xs text-gray-500">{id}</span>
                        </button>
                      ))}
                  </div>
                )}

                {selectedStaffId && (
                  <p className="mt-1 text-xs text-gray-500">Selected ID: {selectedStaffId}</p>
                )}
              </div>
            </div>
          )}

          {/* ROLE */}
          <div>
            <label className={labelClass}>Role</label>
            <input
              className={inputClass}
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {/* JOINED DATE */}
          <div>
            <label className={labelClass}>Joined At</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
            />
          </div>

          {/* LEFT DATE (ONLY IN EDIT) */}
          {isEdit && (
            <div>
              <label className={labelClass}>Left At</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={leftAt}
                onChange={(e) => setLeftAt(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`/projects/${id}/members`)}
            className="px-5 py-2 rounded-md border text-gray-700 bg-white hover:bg-gray-100 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              (isEdit ? updateMutation.isPending : createMutation.isPending) ||
              (!isEdit && !selectedStaffId)
            }
            className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
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