import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { departmentApi, UpdateDepartmentData } from '../../api/department'
import DepartmentForm from '../../components/departments/DepartmentForm'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../lib/utils'

const DepartmentEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: department, isLoading } = useQuery({
    queryKey: ['departments', id],
    queryFn: () => departmentApi.getDepartment(id!),
    enabled: !!id,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateDepartmentData) =>
      departmentApi.updateDepartment(id!, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments', id] })

      toast.success('Department updated successfully')
      navigate('/departments')
    },

    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update department'))
    },
  })

  if (isLoading)
    return <div className="text-center py-8 text-gray-600">Loading...</div>

  if (!department)
    return (
      <div className="text-center py-8 text-gray-600">
        Department not found
      </div>
    )

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/departments')}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-gray-900">Edit Department</h1>
          <p className="text-gray-500 text-sm">
            Update department information below
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl">
        <DepartmentForm
          defaultValues={department}
          onSubmit={mutate}
          isEdit
          loading={isPending}
        />
      </div>
    </div>
  )
}

export default DepartmentEdit
