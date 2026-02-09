import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { attendanceApi } from '../../api/attendance'
import { LeaveRequest } from '../../types'

const LeaveRequests = () => {
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave-requests', statusFilter],
    queryFn: () => attendanceApi.getLeaveRequests({
      status: statusFilter || undefined,
    }),
  })
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    }
    return <span className={styles[status] || 'badge-default'}>{status}</span>
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
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-description">Manage staff leave requests</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Request Leave
        </button>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary-500">Filter by status:</span>
            <div className="flex space-x-2">
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
      </div>
      
      {/* Requests list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : requests?.items.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-8">
              <p className="text-secondary-500">No leave requests found</p>
            </div>
          </div>
        ) : (
          requests?.items.map((request: LeaveRequest) => (
            <div key={request.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getStatusIcon(request.status)}
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-secondary-900">
                        {request.staff_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-secondary-500">
                        {request.leave_type_name || 'Leave'} • {request.days_requested} days
                      </p>
                      <p className="text-sm text-secondary-600 mt-1">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-secondary-500 mt-2">{request.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'pending' && (
                      <>
                        <button className="p-2 rounded-lg hover:bg-green-100 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-100 text-red-600">
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LeaveRequests
