import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

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
      if (tenants.length > 1) {
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
      const message = error.response?.data?.error?.message || 'Login failed'
      toast.error(message)
      console.log("123 error: ",error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Velocity</h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-500 mb-6">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-between text-sm">
              <span></span>
              <Link to="/forgot-password" className="text-teal-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-lg flex justify-center items-center transition"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link to="/register" className="text-teal-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - BRANDING PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-teal-800 to-teal-600 text-white p-16 flex-col justify-center">
        <h2 className="text-4xl font-bold leading-tight mb-6">
          Accelerate Workflows with Velocity
        </h2>

        <p className="text-lg opacity-90 mb-8">
          Velocity empowers teams to manage projects, automate workflows,
          and scale operations seamlessly.
        </p>

        <div className="border-t border-white/30 pt-6">
          <p className="text-sm opacity-80">
            Trusted by growing teams worldwide
          </p>
        </div>
      </div>
    </div>
  )

}

export default Login
