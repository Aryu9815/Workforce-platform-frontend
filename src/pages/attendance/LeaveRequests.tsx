import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText
} from 'lucide-react'
import { attendanceApi, CreateLeaveRequestData } from '../../api/attendance'
import { LeaveRequest, LeaveType } from '../../types'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'
import { showApiError } from '../../lib/utils'

const LeaveRequests = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, getPermissions } = useAuthStore()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Partial<CreateLeaveRequestData>>({
    leave_type_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave-requests', statusFilter],
    queryFn: () =>
      attendanceApi.getLeaveRequests({
        status: statusFilter || undefined
      })
  })

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => attendanceApi.getLeaveTypes()
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveRequestData) =>
      attendanceApi.createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      setIsModalOpen(false)
      toast.success('Leave request submitted')
      setFormData({
        leave_type_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: ''
      })
    },
    onError: (e: any) => {
      showApiError(e, 'Failed to submit request')
    }
  })

  const approveMutation = useMutation({
    mutationFn: (payload: {
      id: string
      status: 'approved' | 'rejected'
      notes?: string
    }) => attendanceApi.approveLeaveRequest(payload.id, payload.status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success(`Request ${vars.status}`)
    },
    onError: (e: any) => {
      showApiError(e, 'Action failed')
    }
  })

  const canViewLeave = getPermissions('leave:view')
  const canRequestLeave = getPermissions('leave:create')
  const canApproveLeave = getPermissions('leave:approve')
  


  if (!canViewLeave) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view leave requests.</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!user || !(user as any).staff_id) {
      toast.error('User staff information missing')
      return
    }

    if (!formData.leave_type_id) newErrors.leave_type = 'Leave type is required'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'

    const days =
      differenceInDays(
        new Date(formData.end_date!),
        new Date(formData.start_date!)
      ) + 1

    if (days <= 0) {
      newErrors.end_date = 'End date must be after start date'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createMutation.mutate({
      ...formData,
      staff_id: (user as any).staff_id,
      days_requested: days
    } as CreateLeaveRequestData)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status}
      </span>
    )
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Leave Requests</h1>
          <p className="text-sm text-gray-500">
            Manage staff leave requests
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          
          {canRequestLeave && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border border-gray-200 p-4 rounded-md bg-white">
        <span className="text-sm font-medium text-gray-700">
          Filter by status:
        </span>

        <div className="flex gap-2 mt-3">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(status === 'all' ? '' : status)
              }
              className={`px-3 py-1 rounded-full text-sm transition ${
                (status === 'all' && !statusFilter) ||
                statusFilter === status
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white p-10 text-center border rounded-md">
            <div className="animate-spin h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading requests...</p>
          </div>
        ) : requests?.items.length === 0 ? (
          <div className="bg-white p-12 text-center border rounded-md">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No leave requests found</p>
          </div>
        ) : (
          requests?.items.map((req: LeaveRequest) => (
            <div
              key={req.id}
              className="bg-white p-5 border rounded-md hover:border-teal-300 transition"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">

                {/* Left content */}
                <div className="flex gap-4">
                  <div className="mt-1">{getStatusIcon(req.status)}</div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {req.staff_name}
                    </h3>

                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {req.leave_type_name}
                      </span>

                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {format(new Date(req.start_date), 'MMM d')} -{' '}
                        {format(
                          new Date(req.end_date),
                          'MMM d yyyy'
                        )}
                      </span>

                      <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {req.days_requested}{' '}
                        {req.days_requested === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    {req.reason && (
                      <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-3 italic">
                        "{req.reason}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-3 border-t md:border-none pt-3 md:pt-0">
                  {getStatusBadge(req.status)}

                  {req.status === 'pending' && canApproveLeave && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          approveMutation.mutate({
                            id: req.id,
                            status: 'approved'
                          })
                        }
                        className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        <CheckCircle className="h-6 w-6" />
                      </button>

                      <button
                        onClick={() =>
                          approveMutation.mutate({
                            id: req.id,
                            status: 'rejected'
                          })
                        }
                        className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
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

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="modal-content p-0 max-w-md">

            {/* Header */}
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">
                Request Leave
              </h2>
              <button
                className="text-secondary-400 hover:text-secondary-600 transition"
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Leave Type */}
              <div className="flex flex-col gap-1">
                <label className="label">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type_id: e.target.value })
                  }
                  className={`input ${errors.leave_type ? 'input-error' : ''}`}
                >
                  <option value="">Select leave type</option>
                  {leaveTypes?.map((lt: LeaveType) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </select>
                {errors.leave_type && <p className="error-message">{errors.leave_type}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="flex flex-col gap-1">
                  <label className="label">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className={`input ${errors.start_date ? 'input-error' : ''}`}
                  />
                  {errors.start_date && <p className="error-message">{errors.start_date}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="label">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className={`input ${errors.end_date ? 'input-error' : ''}`}
                  />
                  {errors.end_date && <p className="error-message">{errors.end_date}</p>}
                </div>

              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1">
                <label className="label">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Explain why you are requesting leave"
                  className="input"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-5 border-t border-secondary-200 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

            </form>
          </div>
        </>

      )}
    </div>
  )
}

export default LeaveRequests
