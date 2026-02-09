import { useQuery } from '@tanstack/react-query'
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Package,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'
import { apiClient } from '../api'

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard')
      return response.data.data
    },
  })
  
  const statCards = [
    {
      title: 'Total Staff',
      value: stats?.total_staff || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Active Projects',
      value: stats?.total_projects || 0,
      icon: FolderKanban,
      color: 'bg-green-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Pending Tasks',
      value: stats?.active_tasks || 0,
      icon: CheckSquare,
      color: 'bg-yellow-500',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'Leave Requests',
      value: stats?.pending_leaves || 0,
      icon: Clock,
      color: 'bg-purple-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Pending Reimbursements',
      value: stats?.pending_reimbursements || 0,
      icon: Receipt,
      color: 'bg-orange-500',
      trend: '-5%',
      trendUp: false,
    },
    {
      title: 'Low Stock Items',
      value: stats?.low_stock_items || 0,
      icon: Package,
      color: 'bg-red-500',
      trend: '0%',
      trendUp: true,
    },
  ]
  
  const attendanceStats = stats?.attendance_today || {
    present: 0,
    absent: 0,
    late: 0,
    on_leave: 0,
  }
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Welcome back! Here's what's happening in your organization today.
        </p>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500">{card.title}</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '-' : card.value}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {card.trendUp ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend}
                </span>
                <span className="text-sm text-secondary-500 ml-2">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance overview */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-secondary-400 mr-2" />
              <h3 className="text-lg font-semibold text-secondary-900">Today's Attendance</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Present</p>
                <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">Absent</p>
                <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">Late</p>
                <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">On Leave</p>
                <p className="text-2xl font-bold text-blue-700">{attendanceStats.on_leave}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent activities */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">Recent Activities</h3>
          </div>
          <div className="card-body">
            {stats?.recent_activities?.length > 0 ? (
              <ul className="space-y-4">
                {stats.recent_activities.map((activity: any, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 text-xs font-medium">
                        {activity.user?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-secondary-900">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-secondary-500">{activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-secondary-500">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
