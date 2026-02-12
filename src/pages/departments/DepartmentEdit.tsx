import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { departmentApi, UpdateDepartmentData } from '../../api/department'
import DepartmentForm from '../../components/departments/DepartmentForm'
import { toast } from 'sonner'

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
    mutationFn: (data: UpdateDepartmentData) => departmentApi.updateDepartment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['departments', id] })
      toast.success('Department updated successfully')
      navigate('/departments')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update department')
    },
  })

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (!department) return <div className="text-center py-8">Department not found</div>

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
          <h1 className="page-title">Edit Department</h1>
          <p className="page-description">Update department details</p>
        </div>
      </div>

      <div className="max-w-2xl">
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
