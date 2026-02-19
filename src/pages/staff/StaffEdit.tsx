import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import StaffForm from '../../components/staff/StaffForm'
import { staffApi } from '../../api/staff'
import { departmentApi } from '../../api/department'
import { designationApi } from '../../api/designation'

const StaffEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /* Fetch Staff */
  const {
    data: staff,
    isLoading: staffLoading,
    isError: staffError
  } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getStaff(id!),
    enabled: !!id
  })

  /* Fetch Departments */
  const {
    data: departments = [],
    isLoading: deptLoading
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments()
  })

  /* Fetch Designations */
  const {
    data: designations = [],
    isLoading: desigLoading
  } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationApi.getDesignations()
  })

  /* Update Staff */
  const updateMutation = useMutation({
    mutationFn: (data: any) => staffApi.updateStaff(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      navigate(`/staff/${id}`)
    }
  })

  /* Loading State */
  if (staffLoading || deptLoading || desigLoading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="text-center text-gray-500 py-16">
          Loading staff data...
        </div>
      </div>
    )
  }

  /* Error State */
  if (staffError || !staff) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="text-center text-red-600 py-16">
          Failed to load staff
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Staff Member
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update details for {staff.full_name}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-gray-200 rounded-md p-8 max-w-5xl">

        <StaffForm
          defaultValues={{
            employee_code: staff.employee_code || '',
            first_name: staff.first_name,
            last_name: staff.last_name,
            phone: staff.phone,
            department_id: staff.department_id,
            designation_id: staff.designation_id,
            reporting_manager_id: staff.reporting_manager_id,
            employment_type: staff.employment_type,
            work_location: staff.work_location,
            skills: staff.skills,
            is_active: staff.is_active,
            join_date: staff.join_date
              ? staff.join_date.split('T')[0]
              : ''
          }}
          departments={departments}
          designations={designations}
          isEdit
          loading={updateMutation.isPending}
          onSubmit={(data) => updateMutation.mutate(data)}
        />

      </div>

    </div>
  )
}

export default StaffEdit
