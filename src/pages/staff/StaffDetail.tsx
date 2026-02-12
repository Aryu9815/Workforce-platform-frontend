import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/api/user'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Edit,
  Trash2
} from 'lucide-react'
import { staffApi } from '../../api/staff'

const StaffDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({
    role_id: '',
    login_email: '',
    is_active: true
  })

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getStaff(id!),
    enabled: !!id
  })

  const deleteMutation = useMutation({
    mutationFn: () => staffApi.deleteStaff(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      navigate('/staff')
    }
  })

  const createUserMutation = useMutation({
    mutationFn: () => userApi.createFromStaff(id!, userForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      setShowUserModal(false)
    }
  })

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (!staff) return <div className="text-center py-8">Staff not found</div>

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/staff')}
            className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="page-title">{staff.full_name}</h1>
            <p className="page-description">
              {staff.employee_code || 'No Employee ID'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/staff/${id}/edit`)}
            className="btn-secondary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure?')) {
                deleteMutation.mutate()
              }
            }}
            className="btn-danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>

          {!staff.user_id && (
            <button
              onClick={() => setShowUserModal(true)}
              className="btn-primary"
            >
              Create Login Account
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start">
            <div className="h-24 w-24 rounded-xl bg-primary-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-700">
                {staff.first_name?.[0]}{staff.last_name?.[0]}
              </span>
            </div>

            <div className="ml-6 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">
                    {staff.full_name}
                  </h2>
                  <p className="text-secondary-500">
                    {staff.designation_name || 'No Designation'}
                  </p>
                </div>

                <span className={`badge ${staff.is_active ? 'badge-success' : 'badge-default'}`}>
                  {staff.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-secondary-400" />
                  {staff.email}
                </div>

                {staff.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-secondary-400" />
                    {staff.phone}
                  </div>
                )}

                {staff.work_location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-secondary-400" />
                    {staff.work_location}
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-secondary-400" />
                  {staff.join_date ? new Date(staff.join_date).toLocaleDateString() : 'N/A'}
                </div>

                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-secondary-400" />
                  {staff.department_name || 'No Department'}
                </div>

                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-2 text-secondary-400" />
                  {staff.employment_type?.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Skills</h3>
        </div>
        <div className="card-body">
          {staff.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {staff.skills.map((skill: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-secondary-100 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p>No skills listed</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-lg font-bold">Create User Account</h2>

            <input
              placeholder="Login Email"
              value={userForm.login_email}
              onChange={(e) =>
                setUserForm(prev => ({ ...prev, login_email: e.target.value }))
              }
              className="input w-full"
            />

            <input
              placeholder="Role ID"
              value={userForm.role_id}
              onChange={(e) =>
                setUserForm(prev => ({ ...prev, role_id: e.target.value }))
              }
              className="input w-full"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => createUserMutation.mutate()}
                className="btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDetail
