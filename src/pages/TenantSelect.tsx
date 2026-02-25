import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { useState } from 'react'
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Velocity</h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Select Organization
          </h2>
          <p className="text-gray-500 mb-6">
            Choose the workspace you want to continue with
          </p>

          {/* Tenant List */}
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant.id)}
                disabled={isLoading === tenant.id}
                className="w-full border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition group"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center">
                    <span className="text-teal-700 font-bold text-lg">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>

                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition">
                      {tenant.name}
                    </h3>
                  </div>
                </div>

                {isLoading === tenant.id ? (
                  <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition" />
                )}
              </button>
            ))}
          </div>

          {/* Switch Account */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                useAuthStore.getState().clearAuth()
                navigate('/login')
              }}
              className="text-sm text-gray-500 hover:text-teal-600 transition"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - BRANDING PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-teal-800 to-teal-600 text-white p-16 flex-col justify-center">
        <h2 className="text-4xl font-bold leading-tight mb-6">
          One Account. Multiple Workspaces.
        </h2>

        <p className="text-lg opacity-90 mb-8">
          Seamlessly switch between organizations and manage your teams,
          projects, and workflows inside Velocity.
        </p>

        <div className="border-t border-white/30 pt-6">
          <p className="text-sm opacity-80">
            Secure • Scalable • Multi-Tenant Ready
          </p>
        </div>
      </div>
    </div>
  )

}

export default TenantSelect
