import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { attendanceApi } from '../../api/attendance'

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => attendanceApi.getAttendanceRecords({
      start_date: selectedDate,
      end_date: selectedDate,
    }),
  })
  
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
      present: 'badge-success',
      absent: 'badge-danger',
      late: 'badge-warning',
      half_day: 'badge-info',
    }
    return <span className={styles[status] || 'badge-default'}>{status.replace('_', ' ')}</span>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Track and manage staff attendance</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-500">Present</p>
                <p className="text-xl font-bold text-secondary-900">-</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-500">Absent</p>
                <p className="text-xl font-bold text-secondary-900">-</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-500">Late</p>
                <p className="text-xl font-bold text-secondary-900">-</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-500">On Leave</p>
                <p className="text-xl font-bold text-secondary-900">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Employee</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Check In</th>
              <th className="table-header-cell">Check Out</th>
              <th className="table-header-cell">Work Hours</th>
              <th className="table-header-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8">Loading...</td>
              </tr>
            ) : records?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">
                  No attendance records for this date
                </td>
              </tr>
            ) : (
              records?.items.map((record: any) => (
                <tr key={record.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className="ml-2 text-sm font-medium text-secondary-900">
                        {record.staff_name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">{getStatusBadge(record.status)}</td>
                  <td className="table-cell">
                    {record.check_in ? (
                      new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {record.check_out ? (
                      new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {record.work_hours ? (
                      <span className="text-sm text-secondary-700">{record.work_hours.toFixed(2)}h</span>
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-secondary-600">{record.notes || '-'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Attendance
