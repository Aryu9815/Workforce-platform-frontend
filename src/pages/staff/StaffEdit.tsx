import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import StaffForm from '../../components/staff/StaffForm'
import { staffApi } from '../../api/staff'


const StaffEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /* ------------------ Fetch Staff ------------------ */
  const {
    data: staff,
    isLoading: staffLoading,
    isError: staffError
  } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getStaff(id!),
    enabled: !!id
  })

  /* ------------------ Fetch Departments ------------------ */
  const {
    data: departments = [],
    isLoading: deptLoading
  } = useQuery({
    queryKey: ['departments'],
    queryFn: staffApi.getDepartments
  })

  /* ------------------ Fetch Designations ------------------ */
  const {
    data: designations = [],
    isLoading: desigLoading
  } = useQuery({
    queryKey: ['designations'],
    queryFn: staffApi.getDesignations
  })

  /* ------------------ Update Staff ------------------ */
  const updateMutation = useMutation({
    mutationFn: (data: any) => staffApi.updateStaff(id!, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      navigate(`/staff/${id}`)
    }
  })

  /* ------------------ Loading State ------------------ */
  if (staffLoading || deptLoading || desigLoading) {
    return <div className="text-center py-8">Loading staff data...</div>
  }

  /* ------------------ Error State ------------------ */
  if (staffError || !staff) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load staff
      </div>
    )
  }

  /* ------------------ Render ------------------ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
        >
          <ArrowLeft className="h-5 w-5 text-secondary-600" />
        </button>

        <div>
          <h1 className="page-title">Edit Staff</h1>
          <p className="page-description">
            Update details for {staff.full_name}
          </p>
        </div>
      </div>

      {/* Form */}
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
  )
}

export default StaffEdit
