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
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'
import { getErrorMessage } from '../../lib/utils'

const LeaveRequests = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [accrualMonth, setAccrualMonth] = useState(
    format(new Date(), 'yyyy-MM')
  )
  const { user, getPermissions } = useAuthStore()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Partial<CreateLeaveRequestData>>({
    leave_type_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  })

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
      queryClient.invalidateQueries(['leave-requests'])
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
      toast.error(getErrorMessage(e, 'Failed to submit request'))
    }
  })

  const approveMutation = useMutation({
    mutationFn: (payload: {
      id: string
      status: 'approved' | 'rejected'
      notes?: string
    }) => attendanceApi.approveLeaveRequest(payload.id, payload.status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['leave-requests'])
      toast.success(`Request ${vars.status}`)
    },
    onError: (e: any) => {
      toast.error(getErrorMessage(e, 'Action failed'))
    }
  })

  const canViewLeave = getPermissions('leave:view')
  const canRequestLeave = getPermissions('leave:create')
  const canApproveLeave = getPermissions('leave:approve')
  
  const accrualMutation = useMutation({
    mutationFn: async () => {
      const [yearStr, monthStr] = accrualMonth.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      return attendanceApi.runLeaveAccrual(year, month)
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Leave accrual executed')
      queryClient.invalidateQueries(['leave-requests'])
    },
    onError: (e: any) => {
      toast.error(getErrorMessage(e, 'Failed to run leave accrual'))
    },
  })


  if (!canViewLeave) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view leave requests.</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !(user as any).staff_id) {
      toast.error('User staff information missing')
      return
    }

    const days =
      differenceInDays(
        new Date(formData.end_date!),
        new Date(formData.start_date!)
      ) + 1

    if (days <= 0) return toast.error('End date must be after start date')

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
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2">
            <label className="text-xs font-medium text-gray-600">
              Accrual month
            </label>
            <input
              type="month"
              value={accrualMonth}
              onChange={(e) => setAccrualMonth(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-teal-600"
            />
            <button
              type="button"
              onClick={() => accrualMutation.mutate()}
              disabled={accrualMutation.isPending}
              className="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {accrualMutation.isPending ? 'Running...' : 'Run Accrual'}
            </button>
          </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">

    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">
        Request Leave
      </h2>
      <button
        className="text-gray-400 hover:text-gray-600 transition"
        onClick={() => setIsModalOpen(false)}
      >
        <XCircle className="h-6 w-6" />
      </button>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

      {/* Leave Type */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Leave Type <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.leave_type_id}
          onChange={(e) =>
            setFormData({ ...formData, leave_type_id: e.target.value })
          }
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
        >
          <option value="">Select leave type</option>
          {leaveTypes?.map((lt: LeaveType) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

      </div>

      {/* Reason */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Reason
        </label>
        <textarea
          rows={4}
          value={formData.reason}
          onChange={(e) =>
            setFormData({ ...formData, reason: e.target.value })
          }
          placeholder="Explain why you are requesting leave"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="flex-1 px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 text-sm transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex-1 px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 text-sm transition disabled:opacity-50"
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
