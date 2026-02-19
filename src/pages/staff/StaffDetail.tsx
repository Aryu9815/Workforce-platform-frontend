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

  if (isLoading)
    return <div className="p-6 text-center text-gray-500">Loading...</div>

  if (!staff)
    return <div className="p-6 text-center text-gray-500">Staff not found</div>

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff')}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {staff.full_name}
            </h1>
            <p className="text-sm text-gray-500">
              {staff.employee_code || 'No Employee ID'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/staff/${id}/edit`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure?')) deleteMutation.mutate()
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>

          {!staff.user_id && (
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition"
            >
              Create Login
            </button>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white border border-gray-200 rounded-md p-6">

        <div className="flex gap-6">

          {/* Avatar */}
          <div className="h-20 w-20 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-semibold">
            {staff.first_name?.[0]}
            {staff.last_name?.[0]}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {staff.full_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {staff.designation_name || 'No Designation'}
                </p>
              </div>

              <span
                className={`text-sm font-medium ${
                  staff.is_active ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Structured Details */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Contact Information
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {staff.email}
                    </div>
                  </div>

                  {staff.phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <div className="flex items-center gap-2 text-gray-800">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {staff.phone}
                      </div>
                    </div>
                  )}

                  {staff.work_location && (
                    <div>
                      <p className="text-gray-500">Location</p>
                      <div className="flex items-center gap-2 text-gray-800">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {staff.work_location}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Employment Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Employment Details
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Join Date</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {staff.join_date
                        ? new Date(staff.join_date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500">Department</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {staff.department_name || 'Not Assigned'}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500">Employment Type</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      {staff.employment_type?.replace('_', ' ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  System Information
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Employee ID</p>
                    <p className="text-gray-800 font-medium">
                      {staff.employee_code || 'Not Assigned'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Account Status</p>
                    <p
                      className={`font-medium ${
                        staff.is_active ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Login Account</p>
                    <p className="text-gray-800">
                      {staff.user_id ? 'Created' : 'Not Created'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Skills
        </h3>

        {staff.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {staff.skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No skills listed</p>
        )}
      </div>

      {/* Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-md w-96 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              Create User Account
            </h2>

            <input
              placeholder="Login Email"
              value={userForm.login_email}
              onChange={(e) =>
                setUserForm(prev => ({ ...prev, login_email: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />

            <input
              placeholder="Role ID"
              value={userForm.role_id}
              onChange={(e) =>
                setUserForm(prev => ({ ...prev, role_id: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => createUserMutation.mutate()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition"
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
