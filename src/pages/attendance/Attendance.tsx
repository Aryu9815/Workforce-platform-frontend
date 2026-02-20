import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Square } from 'lucide-react'
import { attendanceApi } from '../../api/attendance'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { format } from 'date-fns'

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const { user, getPermissions } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () =>
      attendanceApi.getAttendanceRecords({
        start_date: selectedDate,
        end_date: selectedDate
      })
  })

  const { data: stats } = useQuery({
    queryKey: [
      'attendance-stats',
      format(new Date(selectedDate), 'MM'),
      format(new Date(selectedDate), 'yyyy')
    ],
    queryFn: () =>
      attendanceApi.getStats({
        month: parseInt(format(new Date(selectedDate), 'MM')),
        year: parseInt(format(new Date(selectedDate), 'yyyy'))
      })
  })

  const checkInMutation = useMutation({
    mutationFn: (staffId: string) => attendanceApi.checkIn(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      queryClient.invalidateQueries(['attendance-stats'])
      toast.success('Checked in successfully')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || 'Failed to check in')
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: (staffId: string) => attendanceApi.checkOut(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      queryClient.invalidateQueries(['attendance-stats'])
      toast.success('Checked out successfully')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || 'Failed to check out')
    }
  })

  const canViewAttendance = getPermissions('attendance:view')
  const canMarkAttendance = getPermissions('attendance:mark')
  const canEditAttendance = getPermissions('attendance:edit')

  if (!canViewAttendance) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view attendance.</p>
      </div>
    )
  }

  // Today's record for logged-in user
  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr
  const myRecord = records?.items.find(
    r => r.staff_id === (user as any)?.staff_id
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'late':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      half_day: 'bg-blue-100 text-blue-700'
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">
            Track and manage staff attendance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-teal-600 focus:ring-0"
          />

          {isToday && (user as any)?.staff_id && canMarkAttendance && (
            <div className="flex gap-2">
              {!myRecord?.check_in ? (
                <button
                  onClick={() =>
                    checkInMutation.mutate((user as any).staff_id)
                  }
                  className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Check In
                </button>
              ) : !myRecord?.check_out ? (
                <button
                  onClick={() =>
                    checkOutMutation.mutate((user as any).staff_id)
                  }
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Check Out
                </button>
              ) : (
                <span className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Work Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Present',
            value: stats?.days_present || 0,
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
            bg: 'bg-green-100'
          },
          {
            label: 'Absent',
            value: stats?.days_absent || 0,
            icon: <XCircle className="h-5 w-5 text-red-600" />,
            bg: 'bg-red-100'
          },
          {
            label: 'Late',
            value: stats?.days_late || 0,
            icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
            bg: 'bg-yellow-100'
          },
          {
            label: 'Work Hours',
            value: `${stats?.total_work_hours?.toFixed(1) || 0}h`,
            icon: <Clock className="h-5 w-5 text-blue-600" />,
            bg: 'bg-blue-100'
          }
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-md border border-gray-200 flex items-center"
          >
            <div
              className={`h-10 w-10 rounded-md ${card.bg} flex items-center justify-center`}
            >
              {card.icon}
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-semibold text-gray-900">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Employee',
                  'Status',
                  'Check In',
                  'Check Out',
                  'Work Hours',
                  'Notes'
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading attendance data...
                  </td>
                </tr>
              ) : records?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No attendance records for{' '}
                    {format(new Date(selectedDate), 'PPP')}
                  </td>
                </tr>
              ) : (
                records?.items.map(record => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Employee */}
                    <td className="px-6 py-4 flex items-center">
                      {getStatusIcon(record.status)}
                      <span className="ml-3 text-gray-900 font-medium">
                        {record.staff_name || 'Unknown Employee'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Check-in */}
                    <td className="px-6 py-4 text-gray-600">
                      {record.check_in
                        ? format(new Date(record.check_in), 'hh:mm a')
                        : '-'}
                    </td>

                    {/* Check-out */}
                    <td className="px-6 py-4 text-gray-600">
                      {record.check_out
                        ? format(new Date(record.check_out), 'hh:mm a')
                        : '-'}
                    </td>

                    {/* Work hours */}
                    <td className="px-6 py-4 text-gray-600">
                      {record.work_hours
                        ? `${record.work_hours.toFixed(2)}h`
                        : '-'}
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-4 text-gray-600">
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
