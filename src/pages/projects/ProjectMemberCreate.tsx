import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { staffApi } from '../../api/staff'
import { Search } from 'lucide-react'

const ProjectMemberCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [search, setSearch] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [role, setRole] = useState('')
  const [joinedAt, setJoinedAt] = useState('')

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

  const createMutation = useMutation({
    mutationFn: (payload: { staff_id: string; role?: string; joined_at?: string }) =>
      projectsApi.addProjectMember(id!, payload),
    onSuccess: () => {
      navigate(`/projects/${id}/members`)
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) return
    createMutation.mutate({
      staff_id: selectedStaffId,
      role: role || undefined,
      joined_at: joinedAt || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Add Project Member</h1>
        <p className="page-description">Add a staff member to this project</p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
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
            disabled={createMutation.isPending || !selectedStaffId}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectMemberCreate
