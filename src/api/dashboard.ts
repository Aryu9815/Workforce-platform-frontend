import apiClient from './client'

export interface DashboardOverviewResponse {
  hr: {
    total_staff: number
    active_staff: number
  }
  attendance: {
    present: number
    late: number
    absent: number
    overtime_hours: number
  }
  leave: {
    pending: number
    on_leave_today: number
  }
  project: {
    active_projects: number
    total_budget: number
    actual_cost: number
  }
  task: {
    total_tasks: number
    open_tasks: number
    overdue_tasks: number
  }
  finance: {
    total_claim_amount: number
    pending_claims: number
  }
}

export interface AttendanceTrendData {
  month: string
  total_records: number
  total_overtime: number
}

export interface LeaveTrendData {
  month: string
  leave_requests: number
}

export interface ProjectCostTrendData {
  month: string
  actual_cost: number
  budget: number
}

export interface TaskCompletionTrendData {
  month: string
  completed_tasks: number
}

export interface StaffEfficiencyData {
  staff_id: string
  staff_name: string
  completed_tasks: number
  estimated_hours: number
  actual_hours: number
  efficiency_score: number
  efficiency_percentage: number
}

export const dashboardApi = {
  getOverview: async (startDate?: string, endDate?: string): Promise<DashboardOverviewResponse> => {
    const response = await apiClient.get('/dashboard/admin/overview', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  getAttendanceTrend: async (months: number = 6): Promise<{ data: AttendanceTrendData[] }> => {
    const response = await apiClient.get('/dashboard/admin/charts/attendance-trend', {
      params: { months }
    })
    return response.data
  },

  getLeaveTrend: async (months: number = 6): Promise<{ data: LeaveTrendData[] }> => {
    const response = await apiClient.get('/dashboard/admin/charts/leave-trend', {
      params: { months }
    })
    return response.data
  },

  getProjectCostTrend: async (): Promise<{ data: ProjectCostTrendData[] }> => {
    const response = await apiClient.get('/dashboard/admin/charts/project-cost-trend')
    return response.data
  },

  getTaskCompletionTrend: async (): Promise<{ data: TaskCompletionTrendData[] }> => {
    const response = await apiClient.get('/dashboard/admin/charts/task-completion-trend')
    return response.data
  },

  getStaffEfficiency: async (months: number = 3, projectId?: string): Promise<{ data: StaffEfficiencyData[] }> => {
    const response = await apiClient.get('/dashboard/admin/charts/staff-efficiency', {
      params: { months, project_id: projectId }
    })
    return response.data
  }
}
