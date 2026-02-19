import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import StaffForm from '../../components/staff/StaffForm'
import { staffApi } from '../../api/staff'
import { departmentApi } from '../../api/department'
import { designationApi } from '../../api/designation'

const StaffCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch Departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  // Fetch Designations
  const { data: designations, isLoading: designationsLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationApi.getDesignations(),
  })

  const mutation = useMutation({
    mutationFn: staffApi.createStaff,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      navigate(`/staff/${data.id}`)
    },
  })

  const isLoading = departmentsLoading || designationsLoading

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/staff')}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create Staff Member
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details below to add a new employee
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-gray-200 rounded-md p-8 max-w-5xl">

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">
            Loading form data...
          </div>
        ) : (
          <StaffForm
            onSubmit={(data) => mutation.mutate(data)}
            loading={mutation.isPending}
            departments={departments || []}
            designations={designations || []}
            dropdownLoading={isLoading}
          />
        )}

      </div>

    </div>
  )
}

export default StaffCreate
