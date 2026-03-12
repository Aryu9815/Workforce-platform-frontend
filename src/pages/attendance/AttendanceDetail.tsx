import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText,
  MapPin
} from 'lucide-react'
import { attendanceApi } from '../../api/attendance'
import { tasksApi } from '../../api/tasks'
import { format } from 'date-fns'
import { showApiError } from '../../lib/utils'

const AttendanceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['attendance-record', id],
    queryFn: () => attendanceApi.getAttendanceRecord(id!),
    enabled: !!id,
    onError: (e: any) => {
      showApiError(e, 'Failed to fetch attendance record')
    }
  })

  const { data: tasks } = useQuery({
    queryKey: ['assigned-tasks-all'],
    queryFn: () => tasksApi.getTasks({ page_size: 100 }),
    enabled: !!record
  })

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading attendance record.</p>
        <button onClick={() => navigate('/attendance')} className="mt-4 text-teal-600 hover:underline">
          Back to Attendance
        </button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      half_day: 'bg-blue-100 text-blue-700'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.toUpperCase().replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/attendance')}
          className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
          <p className="text-sm text-gray-500">Detailed work log for {record.staff_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
              {getStatusBadge(record.status)}
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-gray-500 mr-2">Date:</span>
                <span className="font-medium text-gray-900">{format(new Date(record.date), 'PPP')}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-gray-500 mr-2">Employee:</span>
                <span className="font-medium text-gray-900">{record.staff_name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-gray-500 mr-2">Work Hours:</span>
                <span className="font-bold text-teal-700">{record.work_hours?.toFixed(2) || '0.00'}h</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Check In</p>
                <p className="text-sm font-medium text-gray-900">
                  {record.check_in ? format(new Date(record.check_in), 'hh:mm:ss a') : '--:--'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Check Out</p>
                <p className="text-sm font-medium text-gray-900">
                  {record.check_out ? format(new Date(record.check_out), 'hh:mm:ss a') : '--:--'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-teal-600" />
              Notes
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 min-h-[100px] whitespace-pre-wrap">
              {record.notes || 'No notes provided for this day.'}
            </div>
          </div>
        </div>

        {/* Task Logs Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-teal-600" />
                Task Timeline
              </h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {record.task_work_sessions?.length || 0} Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Seq</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Task Title</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Start Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">End Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {record.task_work_sessions && record.task_work_sessions.length > 0 ? (
                    record.task_work_sessions.map((log: any, index: number) => {  
                      const task = tasks?.items.find((t: any) => t.id === log.task_id)
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            #{log.sequence}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {task?.title || `${log.task_name}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {log.task_id.substring(0, 13)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(log.check_in), 'hh:mm:ss a')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {log.check_out ? format(new Date(log.check_out), 'hh:mm:ss a') : (
                              <span className="text-teal-600 font-medium flex items-center">
                                <span className="relative flex h-2 w-2 mr-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                                </span>
                                Ongoing
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {log.duration_hours?.toFixed(2) || '0.00'}h
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 italic">
                        No task work sessions recorded for this day.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceDetail
