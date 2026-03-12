import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { showApiError } from '../lib/utils'

interface LoginForm {
  email: string
  password: string
}

const Login = () => {
  const navigate = useNavigate()
  const { setAuthenticated, setAuth, setTenants } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()
  
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      // Login request (public)
      const authResponse = await authApi.login(data)

      // ⭐ Save tokens IMMEDIATELY
      useAuthStore.getState().updateTokens(
        authResponse.access_token,
        authResponse.refresh_token
      )

      // ⭐ NOW axios will attach Authorization header
      const user = await authApi.getCurrentUser()

      const tenants = await authApi.getUserTenants()
      setTenants(tenants)

      // Multi-tenant case
      if (tenants.length > 0) {
        setAuth({
          user,
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token
        })
        console.log("navigate to tenant select", tenants)
        navigate('/select-tenant')
        return 
      }
      console.log("tenants: ",tenants)
      console.log(' No multi-tenant case')
      // Single tenant
      const tenant = tenants[0] || null

      setAuth({
        user,
        tenant,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token
      })
      setAuthenticated()
      toast.success('Welcome back!')
      console.log("navigate to /")
      navigate('/')

    } catch (error: any) {
      showApiError(error, 'Login failed')
      console.log("123 error: ",error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - LOGIN FORM */}
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
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-7">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
              style={{ paddingTop: '10px', paddingBottom: '10px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-teal-600 font-medium hover:text-teal-700">
              Create one
            </Link>
          </p>
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
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
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
            Accelerate your<br />team's velocity
          </h2>

          <p className="text-base text-slate-400 leading-relaxed max-w-sm">
            Manage projects, track attendance, automate workflows, and scale operations — all in one place.
          </p>
        </div>

        <div className="relative border-t border-slate-800 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['T', 'S', 'R', 'P'].map((l, i) => (
                <div key={i} className="h-7 w-7 bg-teal-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold" style={{ borderRadius: '50%' }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              Trusted by <span className="text-slate-300 font-medium">growing teams</span> worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
