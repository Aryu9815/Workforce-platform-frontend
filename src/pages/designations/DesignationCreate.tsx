import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { designationApi, CreateDesignationData } from '../../api/designation'
import { departmentApi } from '../../api/department'
import DesignationForm from '../../components/designations/DesignationForm'
import { toast } from 'sonner'

const DesignationCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateDesignationData) => designationApi.createDesignation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] })
      toast.success('Designation created successfully')
      navigate('/designations')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create designation')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/designations')}
          className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
        >
          <ArrowLeft className="h-5 w-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="page-title">Add Designation</h1>
          <p className="page-description">Create a new designation role</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DesignationForm 
          onSubmit={mutate} 
          loading={isPending} 
          departments={departments || []} 
        />
      </div>
    </div>
  )
}

export default DesignationCreate
