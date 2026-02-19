import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Package,
  Receipt,
  Briefcase,
  ChevronDown,
  Building2,
  Menu
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { useUIStore } from '../store/uiStore'

const Sidebar = () => {
  const location = useLocation()
  const { tenant, user } = useAuthStore()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['staff', 'projects'])
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  
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
      children: [
        { path: '/staff', label: 'All Staff' },
        { path: '/departments', label: 'Departments' },
        { path: '/designations', label: 'Designations' },
      ]
    },
    {
      key: 'projects',
      path: '/projects',
      icon: FolderKanban,
      label: 'Projects',
      children: [
        { path: '/projects', label: 'All Projects' },
        ...(projects?.items || []).map((p: any) => ({
          path: `/projects/${p.id}/workflow`,
          label: p.name || p.code || p.id,
        })),
      ],
    },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    {
      key: 'attendance',
      path: '/attendance',
      icon: Clock,
      label: 'Attendance',
      children: [
        { path: '/attendance', label: 'Records' },
        { path: '/attendance/leave', label: 'Leave Requests' },
      ]
    },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/assets', icon: Briefcase, label: 'Assets' },
    { path: '/reimbursements', icon: Receipt, label: 'Reimbursements' },
  ]
  
  return (
    <aside className={`fixed left-0 top-0 h-full ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-secondary-200 z-50 flex flex-col`}>
      {/* Top bar with toggle + logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-primary-600" />
          {!sidebarCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-secondary-900">Platform</h1>
              {tenant && (
                <p className="text-xs text-secondary-500 truncate max-w-[140px]">
                  {tenant.name}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          className="p-2 rounded-lg hover:bg-secondary-100"
          onClick={toggleSidebarCollapsed}
          title="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-secondary-700" />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path || item.key} className={sidebarCollapsed ? 'flex justify-center' : ''}>
              {sidebarCollapsed ? (
                <NavLink
                  to={item.path || '#'}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-3 rounded-lg ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-100'}`
                  }
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </NavLink>
              ) : !item.children ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key!)}
                    className={`sidebar-link w-full ${
                      item.children.some(child => isActive(child.path)) ? 'active' : ''
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
                  
                  {expandedMenus.includes(item.key!) && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
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
          ))}
        </ul>
      </nav>
      
      {/* User section */}
      <div className="border-t border-secondary-200 p-4">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-secondary-500 truncate">
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
