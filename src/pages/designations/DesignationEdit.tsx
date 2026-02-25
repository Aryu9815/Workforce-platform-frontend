import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { designationApi, UpdateDesignationData } from '../../api/designation'
import { departmentApi } from '../../api/department'
import DesignationForm from '../../components/designations/DesignationForm'
import { toast } from 'sonner'
import { getErrorMessage } from '../../lib/utils'

const DesignationEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: designation, isLoading: isDesigLoading } = useQuery({
    queryKey: ['designations', id],
    queryFn: () => designationApi.getDesignation(id!),
    enabled: !!id
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments()
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateDesignationData) => 
      designationApi.updateDesignation(id!, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] })
      queryClient.invalidateQueries({ queryKey: ['designations', id] })
      toast.success('Designation updated successfully')
      navigate('/designations')
    },

    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update designation'))
    }
  })

  if (isDesigLoading) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>
  }

  if (!designation) {
    return <div className="text-center py-10 text-gray-500">Designation not found</div>
  }

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
          <h1 className="text-xl font-semibold text-gray-900">Edit Designation</h1>
          <p className="text-gray-500 text-sm">
            Update designation details
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <DesignationForm
          defaultValues={designation}
          onSubmit={mutate}
          loading={isPending}
          isEdit
          departments={departments || []}
        />
      </div>

    </div>
  )
}

export default DesignationEdit
