import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Receipt,
  TrendingUp,
  Calendar,
  Briefcase,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  DollarSign
} from 'lucide-react'
import { dashboardApi, projectsApi } from '../api'
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  LineChart, 
  Area, 
  AreaChart,
  Cell,
  Pie,
  PieChart,
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

const Dashboard = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')

  // Fetch dashboard overview
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
  })

  // Fetch charts data
  const { data: attendanceTrend, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: () => dashboardApi.getAttendanceTrend(6),
  })

  const { data: leaveTrend, isLoading: isLeaveLoading } = useQuery({
    queryKey: ['leave-trend'],
    queryFn: () => dashboardApi.getLeaveTrend(6),
  })

  const { data: projectCostTrend, isLoading: isProjectCostLoading } = useQuery({
    queryKey: ['project-cost-trend'],
    queryFn: () => dashboardApi.getProjectCostTrend(),
  })

  const { data: taskCompletionTrend, isLoading: isTaskCompletionLoading } = useQuery({
    queryKey: ['task-completion-trend'],
    queryFn: () => dashboardApi.getTaskCompletionTrend(),
  })

  const { data: staffEfficiency, isLoading: isStaffEfficiencyLoading } = useQuery({
    queryKey: ['staff-efficiency', selectedProjectId],
    queryFn: () => dashboardApi.getStaffEfficiency(3, selectedProjectId === 'all' ? undefined : selectedProjectId),
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ page_size: 100 }),
  })

  const statCards = [
    {
      title: 'Total Staff',
      value: overview?.hr?.total_staff || 0,
      subValue: `${overview?.hr?.active_staff || 0} Active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      accentColor: '#3b82f6',
    },
    {
      title: 'Active Projects',
      value: overview?.project?.active_projects || 0,
      subValue: `Budget: $${(overview?.project?.total_budget || 0).toLocaleString()}`,
      icon: FolderKanban,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      accentColor: '#10b981',
    },
    {
      title: 'Open Tasks',
      value: overview?.task?.open_tasks || 0,
      subValue: `${overview?.task?.overdue_tasks || 0} Overdue`,
      icon: CheckSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      accentColor: '#f59e0b',
    },
    {
      title: 'Pending Leaves',
      value: overview?.leave?.pending || 0,
      subValue: `${overview?.leave?.on_leave_today || 0} On Leave Today`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      accentColor: '#8b5cf6',
    },
    {
      title: 'Pending Claims',
      value: overview?.finance?.pending_claims || 0,
      subValue: `Total: $${(overview?.finance?.total_claim_amount || 0).toLocaleString()}`,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      accentColor: '#f97316',
    },
    {
      title: 'Today Present',
      value: overview?.attendance?.present || 0,
      subValue: `${overview?.attendance?.absent || 0} Absent`,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      accentColor: '#6366f1',
    },
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            System-wide overview and analytics for Orchetrix ERP.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 border border-secondary-200 shadow-sm" style={{ borderRadius: '6px' }}>
          <button className="px-3 py-1.5 text-sm font-medium bg-teal-50 text-teal-700" style={{ borderRadius: '4px' }}>Overview</button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50" style={{ borderRadius: '4px' }}>Analytics</button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50" style={{ borderRadius: '4px' }}>Reports</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isOverviewLoading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-secondary-200 p-5 overflow-hidden" style={{ borderRadius: '6px' }}>
                <div className="skeleton h-9 w-9 mb-4" style={{ borderRadius: '6px' }} />
                <div className="skeleton skeleton-text h-3 w-20 mb-2" />
                <div className="skeleton h-7 w-12 mb-1" />
                <div className="skeleton h-3 w-24" />
              </div>
            ))
          : statCards.map((card) => (
          <Card key={card.title} className={`overflow-hidden border-none shadow-sm ring-1 ring-gray-200 border-l-4`} style={{ borderLeftColor: card.accentColor || '#e2e8f0' }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 ${card.bgColor} ${card.color}`} style={{ borderRadius: '6px' }}>
                  <card.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  {card.subValue}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Cost Trend - Area Chart */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Project Budget vs Actual Cost</CardTitle>
              <CardDescription>Monthly financial performance of projects</CardDescription>
            </div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent className="pt-4 h-[350px]">
            {isProjectCostLoading ? (
              <div className="h-full w-full skeleton" style={{ borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectCostTrend?.data}>
                  <defs>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area 
                    type="monotone" 
                    dataKey="budget" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorBudget)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual_cost" 
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance & Overtime Trend - Combined Chart */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Attendance & Overtime</CardTitle>
              <CardDescription>Monthly attendance records and overtime hours</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent className="pt-4 h-[350px]">
            {isAttendanceLoading ? (
              <div className="h-full w-full skeleton" style={{ borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrend?.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar yAxisId="left" dataKey="total_records" name="Total Records" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="total_overtime" name="Overtime (hrs)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Trend */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Task Completion Trend</CardTitle>
              <CardDescription>Number of tasks completed per month</CardDescription>
            </div>
            <LineChartIcon className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            {isTaskCompletionLoading ? (
              <div className="h-full w-full skeleton" style={{ borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskCompletionTrend?.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="completed_tasks" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981' }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leave Requests Trend */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Leave Requests</CardTitle>
              <CardDescription>Monthly leave application volume</CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            {isLeaveLoading ? (
              <div className="h-full w-full skeleton" style={{ borderRadius: '6px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveTrend?.data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="month" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="leave_requests" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Efficiency Chart */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Staff Efficiency</CardTitle>
            <CardDescription>Efficiency scores based on estimated vs actual hours (Last 3 Months)</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectsData?.items?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 h-[400px]">
          {isStaffEfficiencyLoading ? (
            <div className="h-full w-full skeleton" style={{ borderRadius: '6px' }} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffEfficiency?.data} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="staff_name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 12, fontWeight: 500}}
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === 'Efficiency') return [`${value}%`, name]
                    return [value, name]
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                          <p className="font-semibold text-gray-900 mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">Efficiency: <span className="font-medium text-blue-600">{data.efficiency_percentage}%</span></p>
                            <p className="text-gray-600">Completed Tasks: <span className="font-medium text-gray-900">{data.completed_tasks}</span></p>
                            <p className="text-gray-600">Est. Hours: <span className="font-medium text-gray-900">{data.estimated_hours}</span></p>
                            <p className="text-gray-600">Actual Hours: <span className="font-medium text-gray-900">{data.actual_hours}</span></p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="efficiency_percentage" 
                  name="Efficiency" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24}
                >
                  {staffEfficiency?.data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.efficiency_percentage >= 100 ? '#10b981' : entry.efficiency_percentage >= 80 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary Tables / Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              HR & Staffing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Total Workforce</span>
              <span className="font-semibold">{overview?.hr?.total_staff}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Active Employees</span>
              <span className="font-semibold text-green-600">{overview?.hr?.active_staff}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Inactivity Rate</span>
              <span className="font-semibold text-orange-600">
                {overview?.hr ? Math.round((1 - overview.hr.active_staff / overview.hr.total_staff) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-green-500" />
              Project Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Active Projects</span>
              <span className="font-semibold">{overview?.project?.active_projects}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Budget Utilization</span>
              <span className="font-semibold">
                {overview?.project ? Math.round((overview.project.actual_cost / overview.project.total_budget) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tasks per Project</span>
              <span className="font-semibold text-blue-600">
                {overview?.project && overview?.task ? Math.round(overview.task.total_tasks / overview.project.active_projects) : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Operational Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Overdue Tasks</span>
              <span className="font-semibold text-red-600">{overview?.task?.overdue_tasks}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-500">Pending Leave Requests</span>
              <span className="font-semibold text-orange-600">{overview?.leave?.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Pending Finance Claims</span>
              <span className="font-semibold text-red-600">{overview?.finance?.pending_claims}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
