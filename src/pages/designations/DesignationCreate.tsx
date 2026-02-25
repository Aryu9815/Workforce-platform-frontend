import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { designationApi, CreateDesignationData } from '../../api/designation'
import { departmentApi } from '../../api/department'
import DesignationForm from '../../components/designations/DesignationForm'
import { toast } from 'sonner'
import { getErrorMessage } from '../../lib/utils'

const DesignationCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateDesignationData) =>
      designationApi.createDesignation(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] })
      toast.success('Designation created successfully')
      navigate('/designations')
    },

    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create designation'))
    },
  })

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/designations')}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add Designation</h1>
          <p className="text-gray-500 text-sm">
            Create a new designation role in the organization
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
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
