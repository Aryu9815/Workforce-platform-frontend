import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { useState } from 'react'

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
      // 1️⃣ Switch tenant → get new tokens
      const response = await authApi.switchTenant(tenantId)
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
      })
      setAuthenticated()
      toast.success(`Switched to ${selectedTenant.name}`)
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to switch tenant'
      toast.error(message)
    } finally {
      setIsLoading(null)
    }
  }
  
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-primary-600 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Select Organization</h1>
          <p className="text-secondary-500 mt-1">
            Choose which organization you want to access
          </p>
        </div>
        
        {/* Tenant list */}
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant.id)}
              disabled={isLoading === tenant.id}
              className="w-full card hover:shadow-md transition-shadow text-left group"
            >
              <div className="card-body flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-lg">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {tenant.name}
                    </h3>
                  </div>
                </div>
                
                {isLoading === tenant.id ? (
                  <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* Back to login */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              useAuthStore.getState().clearAuth()
              navigate('/login')
            }}
            className="text-sm text-secondary-500 hover:text-secondary-700"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  )
}

export default TenantSelect
