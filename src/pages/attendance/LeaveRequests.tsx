import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, XCircle, Clock, Calendar, FileText } from 'lucide-react'
import { attendanceApi, CreateLeaveRequestData } from '../../api/attendance'
import { LeaveRequest, LeaveType } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'

const LeaveRequests = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateLeaveRequestData>>({
    leave_type_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  })
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave-requests', statusFilter],
    queryFn: () => attendanceApi.getLeaveRequests({
      status: statusFilter || undefined,
    }),
  })

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => attendanceApi.getLeaveTypes(),
  })
  
  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveRequestData) => attendanceApi.createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      setIsModalOpen(false)
      toast.success('Leave request submitted')
      setFormData({
        leave_type_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit request')
    }
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: 'approved' | 'rejected', notes?: string }) => 
      attendanceApi.approveLeaveRequest(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success(`Request ${variables.status}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Action failed')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

  console.log("SUBMIT CLICKED")   // 👈 add this
console.log(user)    
    if (!user || !(user as any).staff_id) {
      toast.error('User staff information missing')
      return
    }

    const days = differenceInDays(new Date(formData.end_date!), new Date(formData.start_date!)) + 1
    if (days <= 0) {
      toast.error('End date must be after start date')
      return
    }

    createMutation.mutate({
      ...formData as CreateLeaveRequestData,
      staff_id: (user as any).staff_id,
      days_requested: days,
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Leave Requests</h1>
          <p className="text-secondary-500">Manage staff leave requests</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Request Leave
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-secondary-700">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status === 'all' ? '' : status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  (status === 'all' && !statusFilter) || statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Requests list */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-secondary-500">Loading requests...</p>
          </div>
        ) : requests?.items.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-secondary-200">
            <Calendar className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500">No leave requests found</p>
          </div>
        ) : (
          requests?.items.map((request: LeaveRequest) => (
            <div key={request.id} className="bg-white p-5 rounded-lg shadow-sm border border-secondary-200 hover:border-primary-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(request.status)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-secondary-900">
                      {request.staff_name || 'Unknown Employee'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="inline-flex items-center text-sm text-secondary-600">
                        <FileText className="h-4 w-4 mr-1 text-secondary-400" />
                        {request.leave_type_name || 'Leave'}
                      </span>
                      <span className="inline-flex items-center text-sm text-secondary-600">
                        <Calendar className="h-4 w-4 mr-1 text-secondary-400" />
                        {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {request.days_requested} {request.days_requested === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-secondary-500 mt-3 bg-secondary-50 p-2 rounded italic">
                        "{request.reason}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                  {getStatusBadge(request.status)}
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approveMutation.mutate({ id: request.id, status: 'approved' })}
                        disabled={approveMutation.isPending}
                        className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={() => approveMutation.mutate({ id: request.id, status: 'rejected' })}
                        disabled={approveMutation.isPending}
                        className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-secondary-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-secondary-900">Request Leave</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary-400 hover:text-secondary-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Leave Type</label>
                <select
                  required
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes?.map((type: LeaveType) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Why are you taking leave?"
                ></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveRequests
