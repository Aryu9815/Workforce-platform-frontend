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
  Briefcase,
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
    // { path: '/reimbursements', icon: Receipt, label: 'Reimbursements' },
    
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
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center min-w-0">
          <div className="h-8 w-8 bg-teal-600 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '6px' }}>
            <Building2 className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 min-w-0">
              <h1 className="text-sm font-bold text-white leading-tight">Velocity</h1>
              {tenant && (
                <p className="text-xs text-slate-400 truncate max-w-[130px] leading-tight mt-0.5">
                  {tenant.name}
                </p>
              )}
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 hover:bg-slate-800 transition-colors flex-shrink-0"
            style={{ borderRadius: '4px' }}
            title="Collapse sidebar"
          >
            <Menu className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 scrollbar-hide">
        {!sidebarCollapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Navigation
          </p>
        )}
        <ul className="space-y-0.5">
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
                    `flex items-center justify-center p-2.5 transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-800 text-teal-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  style={{ borderRadius: '4px' }}
                  title={item.label}
                >
                  <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </NavLink>
              ) : !item.children ? (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-800 text-white font-medium border-l-2 border-teal-400'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-normal'
                    }`
                  }
                  style={({ isActive }) => ({ 
                    borderRadius: '4px',
                    paddingLeft: isActive ? 'calc(0.625rem - 2px)' : '0.625rem'
                  })}
                >
                  <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key!)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 text-sm w-full transition-all duration-150 ${
                      isGroupActive
                        ? 'bg-slate-800/80 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-normal'
                    }`}
                    style={{ borderRadius: '4px' }}
                  >
                    <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
                        expandedMenus.includes(item.key!) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      expandedMenus.includes(item.key!) && visibleChildren.length > 0
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l border-slate-800 pl-2.5">
                      {visibleChildren.map((child: any) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-2.5 py-1.5 text-xs transition-all duration-150 ${
                                isActive
                                  ? 'text-teal-400 font-medium bg-slate-800/60'
                                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-normal'
                              }`
                            }
                            style={{ borderRadius: '4px' }}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
              )
            })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800/80 p-3">
        <div
          className={`flex items-center gap-3 p-2 hover:bg-slate-800/60 transition-colors cursor-default ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
          style={{ borderRadius: '4px' }}
        >
          <div
            className="h-8 w-8 bg-teal-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ borderRadius: '50%' }}
          >
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">
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
