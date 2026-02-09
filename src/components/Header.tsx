import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const Header = () => {
  const navigate = useNavigate()
  const { user, tenant, tenants, refreshToken, clearAuth, setTenant } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTenantMenu, setShowTenantMenu] = useState(false)
  
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
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Tenant selector */}
        {tenants.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <Building2 className="h-5 w-5 text-secondary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {tenant?.name || 'Select Tenant'}
              </span>
              <ChevronDown className="h-4 w-4 text-secondary-400" />
            </button>
            
            {showTenantMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSwitchTenant(t)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 ${
                      t.id === tenant?.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors">
          <Bell className="h-5 w-5 text-secondary-500" />
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        
        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-secondary-400" />
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-secondary-200">
                <p className="text-sm font-medium text-secondary-900">{user?.full_name}</p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
              
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/profile')
                }}
                className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>
              
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/settings')
                }}
                className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
              
              <div className="border-t border-secondary-200 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
