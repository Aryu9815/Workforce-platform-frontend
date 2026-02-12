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
    mutationFn: (data: CreateDepartmentData) => departmentApi.createDepartment(data),
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
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/departments')}
          className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
        >
          <ArrowLeft className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="page-title">Add Department</h1>
          <p className="page-description">Create a new department for your organization</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DepartmentForm onSubmit={mutate} loading={isPending} />
      </div>
    </div>
  )
}

export default DepartmentCreate
