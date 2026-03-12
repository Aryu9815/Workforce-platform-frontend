import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Square, Activity, ChevronDown, ChevronUp, Save, List, Eye, Sparkles } from 'lucide-react'
import { attendanceApi } from '../../api/attendance'
import { taskWorkApi } from '../../api/taskWork'
import { tasksApi } from '../../api/tasks'
import { aiApi } from '../../api/ai'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { showApiError } from '../../lib/utils'
import { AIRegenerateButton } from '../../components/ui/AIRegenerateButton'
import { AutoResizingTextarea } from '../../components/ui/AutoResizingTextarea'

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const { user, getPermissions } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () =>
      attendanceApi.getAttendanceRecords({
        start_date: selectedDate,
        end_date: selectedDate
      })
  })

  const { data: tasks } = useQuery({
    queryKey: ['assigned-tasks', (user as any)?.staff_id],
    queryFn: () => tasksApi.getAssignedTasks((user as any).staff_id),
    enabled: !!(user as any)?.staff_id
  })

  const { data: mySessions } = useQuery({
    queryKey: ['my-task-sessions'],
    queryFn: () => taskWorkApi.getMySessions(),
    enabled: !!(user as any)?.staff_id
  })

  const activeSession = mySessions?.find(s => !s.check_out)

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
      showApiError(e, 'Failed to check in')
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: (staffId: string) => attendanceApi.checkOut(staffId, undefined, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      queryClient.invalidateQueries(['attendance-stats'])
      queryClient.invalidateQueries(['my-task-sessions'])
      toast.success('Checked out successfully')
    },
    onError: (e: any) => {
      showApiError(e, 'Failed to check out')
    }
  })

  const switchTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskWorkApi.start({ task_id: taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-task-sessions'])
      queryClient.invalidateQueries(['attendance'])
      toast.success('Task switched successfully')
    },
    onError: (e: any) => {
      showApiError(e, 'Failed to switch task')
    }
  })

  const stopTaskMutation = useMutation({
    mutationFn: () => taskWorkApi.stop(),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-task-sessions'])
      queryClient.invalidateQueries(['attendance'])
      toast.success('Task stopped successfully')
    },
    onError: (e: any) => {
      showApiError(e, 'Failed to stop task')
    }
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      attendanceApi.updateAttendance(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      toast.success('Notes updated')
    },
    onError: (e: any) => {
      showApiError(e, 'Failed to update notes')
    }
  })

  const canViewAttendance = getPermissions('attendance:view')
  const canMarkAttendance = getPermissions('attendance:mark')

  // Today's record for logged-in user
  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr
  const myRecord = records?.items.find(
    r => r.staff_id === (user as any)?.staff_id
  )

  useEffect(() => {
    if (myRecord) {
      setNotes(myRecord.notes || '')
    }
  }, [myRecord])

  if (!canViewAttendance) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view attendance.</p>
      </div>
    )
  }

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

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
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
            <div className="flex flex-wrap items-center gap-2">
              {!myRecord?.check_in ? (
                <button
                  onClick={() =>
                    checkInMutation.mutate((user as any).staff_id)
                  }
                  disabled={checkInMutation.isLoading}
                  className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Check In
                </button>
              ) : !myRecord?.check_out ? (
                <>
                  {/* Task Switcher */}
                  <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden">
                    <div className="pl-3 py-2 text-gray-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <select
                      value={activeSession?.task_id || ''}
                      onChange={(e) => e.target.value && switchTaskMutation.mutate(e.target.value)}
                      disabled={switchTaskMutation.isLoading}
                      className="border-none focus:ring-0 text-sm py-2 pr-8 pl-2 bg-transparent cursor-pointer"
                    >
                      <option value="">-- Switch Task --</option>
                      {tasks?.map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    {activeSession && (
                      <button
                        onClick={() => stopTaskMutation.mutate()}
                        disabled={stopTaskMutation.isLoading}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 border-l border-gray-200"
                        title="Stop Current Task"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      checkOutMutation.mutate((user as any).staff_id)
                    }
                    disabled={checkOutMutation.isLoading}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Check Out
                  </button>
                </>
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
            className="bg-white p-4 rounded-md border border-gray-200 flex items-center shadow-sm"
          >
            <div
              className={`h-10 w-10 rounded-md ${card.bg} flex items-center justify-center`}
            >
              {card.icon}
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Current User Notes Section */}
      {myRecord && !myRecord.check_out && isToday && (
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <List className="h-4 w-4 mr-2 text-teal-600" />
              Daily Notes
            </h3>
            <div className="flex items-center gap-2">
              <AIRegenerateButton 
                value={notes} 
                onRegenerated={(newNotes) => setNotes(newNotes)}
              />
              <button
                onClick={() => updateNotesMutation.mutate({ id: myRecord.id, notes })}
                disabled={updateNotesMutation.isLoading || notes === (myRecord.notes || '')}
                className="flex items-center text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Notes
              </button>
            </div>
          </div>
          <AutoResizingTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your work today..."
            className="w-full min-h-[5rem] p-3 text-sm border border-gray-200 rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      )}

      {/* Attendance Table */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                {[
                  'Employee',
                  'Status',
                  'Check In',
                  'Check Out',
                  'Work Hours',
                  'Notes',
                  'Actions'
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider"
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
                    colSpan={8}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading attendance data...
                  </td>
                </tr>
              ) : records?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No attendance records for{' '}
                    {format(new Date(selectedDate), 'PPP')}
                  </td>
                </tr>
              ) : (
                records?.items.map(record => (
                  <>
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition cursor-pointer group"
                    >
                      <td className="px-4 py-4 text-center" onClick={() => toggleRow(record.id)}>
                        {record.task_work_sessions && record.task_work_sessions.length > 0 && (
                          expandedRows[record.id] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      {/* Employee */}
                      <td className="px-6 py-4 flex items-center" onClick={() => navigate(`/attendance/${record.id}`)}>
                        {getStatusIcon(record.status)}
                        <span className="ml-3 text-teal-700 font-semibold group-hover:underline">
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
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {record.work_hours
                          ? `${record.work_hours.toFixed(2)}h`
                          : '-'}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                        {record.notes || '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => navigate(`/attendance/${record.id}`)}
                          className="p-1 hover:bg-teal-50 rounded-full text-teal-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable Task Log */}
                    {expandedRows[record.id] && record.task_work_sessions && record.task_work_sessions.length > 0 && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={8} className="px-12 py-4">
                          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full text-xs">
                              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Seq</th>
                                  <th className="px-4 py-2 text-left font-medium">Task</th>
                                  <th className="px-4 py-2 text-left font-medium">Start</th>
                                  <th className="px-4 py-2 text-left font-medium">End</th>
                                  <th className="px-4 py-2 text-left font-medium">Duration</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {record.task_work_sessions.map((log: any, idx: number) => {
                                  const task = tasks?.find(t => t.id === log.task_id)
                                  return (
                                    <tr key={idx} className="text-gray-600">
                                      <td className="px-4 py-2">{log.sequence}</td>
                                      <td className="px-4 py-2 font-medium text-gray-900">
                                        {task?.title || `Task ${log.task_id.substring(0, 8)}`}
                                      </td>
                                      <td className="px-4 py-2">
                                        {format(new Date(log.check_in), 'hh:mm a')}
                                      </td>
                                      <td className="px-4 py-2">
                                        {log.check_out ? format(new Date(log.check_out), 'hh:mm a') : 'Ongoing'}
                                      </td>
                                      <td className="px-4 py-2 font-medium">
                                        {log.duration_hours ? `${log.duration_hours.toFixed(2)}h` : '-'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
