import apiClient from './client'
import { AttendanceRecord, LeaveRequest, LeaveType, PaginatedResponse } from '../types'

export interface CreateAttendanceData {
  staff_id: string
  date: string
  shift_id?: string
  check_in?: string
  check_out?: string
  check_in_location?: any
  check_out_location?: any
  status?: 'present' | 'absent' | 'late' | 'half_day'
  notes?: string
}

export interface CreateLeaveRequestData {
  staff_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason?: string
  documents?: any[]
}

export const attendanceApi = {
  // Attendance records
  getAttendanceRecords: async (params?: {
    page?: number
    page_size?: number
    staff_id?: string
    start_date?: string
    end_date?: string
    status?: string
  }): Promise<PaginatedResponse<AttendanceRecord>> => {
    const response = await apiClient.get('/attendance/records', { params })
    return response.data
  },
  
  checkIn: async (staffId: string, location?: any): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/attendance/check-in', null, {
      params: { staff_id: staffId, location }
    })
    return response.data
  },
  
  checkOut: async (staffId: string, location?: any): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/attendance/check-out', null, {
      params: { staff_id: staffId, location }
    })
    return response.data
  },
  
  // Leave requests
  getLeaveRequests: async (params?: {
    page?: number
    page_size?: number
    staff_id?: string
    status?: string
  }): Promise<PaginatedResponse<LeaveRequest>> => {
    const response = await apiClient.get('/attendance/leave-requests', { params })
    return response.data
  },
  
  createLeaveRequest: async (data: CreateLeaveRequestData): Promise<LeaveRequest> => {
    const response = await apiClient.post('/attendance/leave-requests', data)
    return response.data
  },
  
  approveLeaveRequest: async (id: string, status: 'approved' | 'rejected', notes?: string): Promise<LeaveRequest> => {
    const response = await apiClient.put(`/attendance/leave-requests/${id}/approve`, {
      status,
      approval_notes: notes
    })
    return response.data
  },
  
  // Leave types
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await apiClient.get('/attendance/leave-types')
    return response.data
  },
  
  // Stats
  getStats: async (params?: {
    staff_id?: string
    month?: number
    year?: number
  }): Promise<any> => {
    const response = await apiClient.get('/attendance/stats', { params })
    return response.data
  },
}
