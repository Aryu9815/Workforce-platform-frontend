import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, Building2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { useState } from 'react'
import subscribeToPush from '../lib/subscribeToPush'
import { getErrorMessage } from '../lib/utils'

const TenantSelect = () => {
  const navigate = useNavigate()
  const { tenants, setAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSelectTenant = async (tenantId: string) => {
    setIsLoading(tenantId)

    try {
      const selectedTenant = tenants.find(t => t.id === tenantId)
      if (!selectedTenant) {
        toast.error('Tenant not found')
        return
      }
      const response = await authApi.switchTenant(tenantId)
      const permissions = response.permissions || []
      console.log('Switch tenant permissions:', permissions)
      // 2️⃣ Update tokens immediately
      useAuthStore.getState().updateTokens(
        response.access_token,
        response.refresh_token
      )
      // 3️⃣ Fetch fresh identity (VERY IMPORTANT)
      const freshUser = await authApi.getCurrentUser()
      // 4️⃣ Replace auth state fully
      useAuthStore.getState().setAuth({
        user: freshUser!,
        tenant: selectedTenant,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        permissions,
      })
      setAuthenticated()
      console.log("call push")
      await subscribeToPush();
      console.log("push called")
      toast.success(`Switched to ${selectedTenant.name}`)
      navigate('/')
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to switch tenant'))
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - TENANT SELECTION */}
      <div className="w-full lg:w-5/12 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 bg-teal-600 flex items-center justify-center" style={{ borderRadius: '6px' }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Velocity</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Select workspace
          </h2>
          <p className="text-sm text-gray-500 mb-7">
            Choose the workspace you want to continue with
          </p>

          {/* Tenant List */}
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant.id)}
                disabled={!!isLoading}
                className={`w-full border border-secondary-200 p-3.5 flex items-center justify-between transition-all duration-150 group text-left ${
                  isLoading === tenant.id
                    ? 'border-teal-300 bg-teal-50'
                    : 'hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-sm'
                } disabled:opacity-60`}
                style={{ borderRadius: '6px' }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-10 w-10 bg-teal-100 flex items-center justify-center flex-shrink-0"
                    style={{ borderRadius: '6px' }}
                  >
                    <span className="text-teal-700 font-bold text-base">
                      {tenant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors duration-150">
                      {tenant.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Workspace</p>
                  </div>
                </div>

                {isLoading === tenant.id ? (
                  <Loader2 className="h-4 w-4 text-teal-600 animate-spin flex-shrink-0" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 transition-colors duration-150 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Switch Account */}
          <div className="text-center mt-8">
            <button
              onClick={() => {
                useAuthStore.getState().clearAuth()
                navigate('/login')
              }}
              className="text-sm text-gray-400 hover:text-teal-600 transition-colors duration-150"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - BRANDING PANEL */}
      <div className="hidden lg:flex flex-1 bg-slate-900 text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 h-96 w-96 bg-teal-600/10 rounded-full" />
          <div className="absolute bottom-0 left-0 h-64 w-64 bg-teal-600/10 rounded-full -translate-x-1/2 translate-y-1/2" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid3)" />
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-8 w-8 bg-teal-600 flex items-center justify-center" style={{ borderRadius: '6px' }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Velocity</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-5">
            One account.<br />Multiple workspaces.
          </h2>

          <p className="text-base text-slate-400 leading-relaxed max-w-sm">
            Seamlessly switch between organizations and manage your teams, projects, and workflows inside Velocity.
          </p>
        </div>

        <div className="relative border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-500">
            Secure · Scalable · Multi-Tenant Ready
          </p>
        </div>
      </div>
    </div>
  )
}

export default TenantSelect
