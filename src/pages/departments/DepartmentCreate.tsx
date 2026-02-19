import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { departmentApi, CreateDepartmentData } from '../../api/department'
import DepartmentForm from '../../components/departments/DepartmentForm'
import { toast } from 'sonner'

const DepartmentCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateDepartmentData) =>
      departmentApi.createDepartment(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department created successfully')
      navigate('/departments')
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create department')
    },
  })

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
          <h1 className="text-xl font-semibold text-gray-900">Add Department</h1>
          <p className="text-gray-500 text-sm">
            Create a new department for your organization
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <DepartmentForm
          onSubmit={mutate}
          loading={isPending}
        />
      </div>

    </div>
  )
}

export default DepartmentCreate
