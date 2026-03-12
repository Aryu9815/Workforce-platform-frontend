import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Search,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Settings
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { notificationsApi } from '../api'
import { NotificationSidebar } from './NotificationSidebar'

const Header = () => {
  const navigate = useNavigate()
  const { user, tenant, tenants, refreshToken, clearAuth, setTenant } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTenantMenu, setShowTenantMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 15000,
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const handleSwitchTenant = async (newTenant: any) => {
    try {
      const response = await authApi.switchTenant(newTenant.id)
      setTenant(newTenant)
      useAuthStore.getState().updateTokens(response.access_token, response.refresh_token)
      setShowTenantMenu(false)
      window.location.reload()
    } catch (error) {
      console.error('Switch tenant error:', error)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-5 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-secondary-200 bg-secondary-50 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 focus:bg-white transition-all duration-150"
            style={{ borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Tenant selector */}
        {tenants.length > 1 && (
          <div className="relative">
            <button
              onClick={() => { setShowTenantMenu(!showTenantMenu); setShowUserMenu(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-colors duration-150"
              style={{ borderRadius: '4px' }}
            >
              <Building2 className="h-4 w-4 text-secondary-400" />
              <span className="font-medium text-secondary-700 max-w-[120px] truncate">
                {tenant?.name || 'Select Tenant'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-secondary-400" />
            </button>

            {showTenantMenu && (
              <div
                className="absolute right-0 mt-1.5 w-52 bg-white border border-secondary-200 shadow-lg py-1 z-50"
                style={{ borderRadius: '6px', animation: 'slideDown 0.15s ease-out' }}
              >
                <div className="px-3 py-1.5 border-b border-secondary-100 mb-1">
                  <p className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wider">Switch workspace</p>
                </div>
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSwitchTenant(t)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-100 ${
                      t.id === tenant?.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <span className="h-5 w-5 bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ borderRadius: '3px' }}>
                      {t.name?.[0]?.toUpperCase()}
                    </span>
                    {t.name}
                    {t.id === tenant?.id && (
                      <span className="ml-auto text-[10px] text-teal-500 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification bell */}
        <button
          onClick={() => { setShowNotifications(true); setShowUserMenu(false); setShowTenantMenu(false) }}
          className="relative p-2 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 transition-colors duration-150"
          style={{ borderRadius: '4px' }}
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center px-0.5"
              style={{ borderRadius: '99px' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-secondary-200 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowTenantMenu(false) }}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary-100 transition-colors duration-150"
            style={{ borderRadius: '4px' }}
          >
            <div
              className="h-7 w-7 bg-teal-700 flex items-center justify-center flex-shrink-0"
              style={{ borderRadius: '50%' }}
            >
              <span className="text-white font-semibold text-xs">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-secondary-800 leading-tight">{user?.first_name}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-secondary-400" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-1.5 w-52 bg-white border border-secondary-200 shadow-lg py-1 z-50"
              style={{ borderRadius: '6px', animation: 'slideDown 0.15s ease-out' }}
            >
              <div className="px-3 py-2.5 border-b border-secondary-100">
                <p className="text-sm font-semibold text-secondary-900 leading-tight">{user?.full_name}</p>
                <p className="text-xs text-secondary-500 mt-0.5 leading-tight truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile') }}
                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 flex items-center gap-2.5 transition-colors duration-100"
                >
                  <User className="h-3.5 w-3.5 text-secondary-400 flex-shrink-0" />
                  Profile
                </button>

                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings') }}
                  className="w-full px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 flex items-center gap-2.5 transition-colors duration-100"
                >
                  <Settings className="h-3.5 w-3.5 text-secondary-400 flex-shrink-0" />
                  Settings
                </button>
              </div>

              <div className="border-t border-secondary-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors duration-100"
                >
                  <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NotificationSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  )
}

export default Header
