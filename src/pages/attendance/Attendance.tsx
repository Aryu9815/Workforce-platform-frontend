import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Play, Square } from 'lucide-react'
import { attendanceApi } from '../../api/attendance'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { format } from 'date-fns'

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => attendanceApi.getAttendanceRecords({
      start_date: selectedDate,
      end_date: selectedDate,
    }),
  })

  const { data: stats } = useQuery({
    queryKey: ['attendance-stats', format(new Date(selectedDate), 'MM'), format(new Date(selectedDate), 'yyyy')],
    queryFn: () => attendanceApi.getStats({
      month: parseInt(format(new Date(selectedDate), 'MM')),
      year: parseInt(format(new Date(selectedDate), 'yyyy')),
    }),
  })

  const checkInMutation = useMutation({
    mutationFn: (staffId: string) => attendanceApi.checkIn(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      toast.success('Checked in successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to check in')
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: (staffId: string) => attendanceApi.checkOut(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      toast.success('Checked out successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to check out')
    }
  })

  // Find current user's record for today
  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr
  const myRecord = records?.items.find(r => r.staff_id === (user as any)?.staff_id)
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'late':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-secondary-400" />
    }
  }
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      absent: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
      late: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      half_day: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    }
    return <span className={styles[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'}>{status.replace('_', ' ')}</span>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Attendance</h1>
          <p className="text-secondary-500">Track and manage staff attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          
          {isToday && (user as any)?.staff_id && (
            <div className="flex gap-2">
              {!myRecord?.check_in ? (
                <button 
                  onClick={() => checkInMutation.mutate((user as any).staff_id)}
                  disabled={checkInMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Check In
                </button>
              ) : !myRecord?.check_out ? (
                <button 
                  onClick={() => checkOutMutation.mutate((user as any).staff_id)}
                  disabled={checkOutMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Check Out
                </button>
              ) : (
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Work Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-secondary-500">Present</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.days_present || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-secondary-500">Absent</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.days_absent || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-secondary-500">Late</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.days_late || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-secondary-500">Work Hours</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.total_work_hours?.toFixed(1) || 0}h</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance table */}
      <div className="bg-white shadow-sm border border-secondary-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-secondary-500">Loading attendance data...</td>
                </tr>
              ) : records?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-secondary-500">
                    No attendance records for {format(new Date(selectedDate), 'PPP')}
                  </td>
                </tr>
              ) : (
                records?.items.map((record) => (
                  <tr key={record.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className="ml-3 text-sm font-medium text-secondary-900">
                          {record.staff_name || 'Unknown Employee'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {record.work_hours ? `${record.work_hours.toFixed(2)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Attendance
