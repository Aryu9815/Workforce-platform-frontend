import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  Receipt,
  ChevronDown,
  Building2,
  Menu,
  Briefcase
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { useUIStore } from '../store/uiStore'

const Sidebar = () => {
  const location = useLocation()
  const { tenant, user, getPermissions } = useAuthStore()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['staff', 'projects'])
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev =>
      prev.includes(menu)
        ? prev.filter(m => m !== menu)
        : [...prev, menu]
    )
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const { data: projects } = useQuery({
    queryKey: ['sidebar-projects'],
    queryFn: () => projectsApi.getProjects({ page_size: 50 }),
  })

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    {
      key: 'staff',
      path: '/staff',
      icon: Users,
      label: 'Staff',
      requiredPermission: 'staff:view',
      children: [
        { path: '/staff', label: 'All Staff' , requiredPermission: 'staff:view'},
        { path: '/departments', label: 'Departments' , requiredPermission: 'department:view'},
        { path: '/designations', label: 'Designations' , requiredPermission: 'designation:view'},
      ]
    },
    {
      key: 'projects',
      path: '/projects',
      icon: FolderKanban,
      label: 'Projects',
      requiredPermission: 'project:view',
      children: [
        { path: '/projects', label: 'All Projects' , requiredPermission: 'project:view'},
        ...(projects?.items || []).map((p: any) => ({
          path: `/projects/${p.id}/workflow`,
          label: p.name || p.code || p.id,
          requiredPermission: 'project:view',
        })),
      ],
    },
    {
      key: 'attendance',
      path: '/attendance',
      icon: Clock,
      label: 'Attendance',
      requiredPermission: 'attendance:view',
      children: [
        { path: '/attendance', label: 'Records', requiredPermission: 'attendance:view'},
        { path: '/attendance/leave', label: 'Leave Requests', requiredPermission: 'leave:view' },
      ]
    },
    { path: '/assets', icon: Briefcase, label: 'Assets', requiredPermission: 'asset:view' },
    { path: '/reimbursements', icon: Receipt, label: 'Reimbursements', requiredPermission: 'reimbursement:view' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-full ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 text-slate-200 transition-all duration-300 flex flex-col z-40`}
      onMouseEnter={() => {
        if (sidebarCollapsed) setSidebarCollapsed(false)
      }}
    >
      {/* Top Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center">
          <Building2 className="h-7 w-7 text-teal-500" />
          {!sidebarCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-white">Velocity</h1>
              {tenant && (
                <p className="text-xs text-slate-400 truncate max-w-[140px]">
                  {tenant.name}
                </p>
              )}
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-2 rounded-md hover:bg-slate-800 transition"
            title="Close sidebar"
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <ul className="space-y-1">
          {menuItems
            .filter((item) => {
              const hasItemPermission =
                !('requiredPermission' in item) ||
                !item.requiredPermission ||
                getPermissions(item.requiredPermission)

              if (hasItemPermission) return true

              if (item.children && item.children.length > 0) {
                return item.children.some(
                  (child: any) =>
                    !child.requiredPermission || getPermissions(child.requiredPermission)
                )
              }

              return false
            })
            .map((item) => {
              const visibleChildren =
                item.children?.filter(
                  (child: any) =>
                    !child.requiredPermission || getPermissions(child.requiredPermission)
                ) || []

              const isGroupActive =
                visibleChildren.length > 0 &&
                visibleChildren.some((child: any) => isActive(child.path))

              return (
            <li key={item.path || item.key}>
              {/* Collapsed Mode */}
              {sidebarCollapsed ? (
                <NavLink
                  to={item.path || '#'}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-3 rounded-lg transition ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </NavLink>
              ) : !item.children ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key!)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition ${
                      isGroupActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedMenus.includes(item.key!) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedMenus.includes(item.key!) && visibleChildren.length > 0 && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {visibleChildren.map((child: any) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 text-sm rounded-md transition ${
                                isActive
                                  ? 'bg-teal-600 text-white'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
              )
            })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-4">
        <div
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>

          {!sidebarCollapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
