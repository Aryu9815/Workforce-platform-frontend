import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { designationApi, UpdateDesignationData } from '../../api/designation'
import { departmentApi } from '../../api/department'
import DesignationForm from '../../components/designations/DesignationForm'
import { toast } from 'sonner'

const DesignationEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: designation, isLoading: isDesigLoading } = useQuery({
    queryKey: ['designations', id],
    queryFn: () => designationApi.getDesignation(id!),
    enabled: !!id,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateDesignationData) => designationApi.updateDesignation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] })
      queryClient.invalidateQueries({ queryKey: ['designations', id] })
      toast.success('Designation updated successfully')
      navigate('/designations')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update designation')
    },
  })

  if (isDesigLoading) return <div className="text-center py-8">Loading...</div>
  if (!designation) return <div className="text-center py-8">Designation not found</div>

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
          <h1 className="page-title">Edit Designation</h1>
          <p className="page-description">Update designation details</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <DesignationForm
          defaultValues={designation}
          onSubmit={mutate}
          isEdit
          loading={isPending}
          departments={departments || []}
        />
      </div>
    </div>
  )
}

export default DesignationEdit
