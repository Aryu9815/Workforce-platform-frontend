import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { showApiError } from '../lib/utils'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  phone?: string
  password: string
  confirm_password: string
}

const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()
  
  const password = watch('password')
  
  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    
    try {
      await authApi.register({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })
      
      toast.success('Account created successfully! Please sign in.')
      navigate('/login')
    } catch (error: any) {
      showApiError(error, 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Velocity</h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-500 mb-6">
            Get started with your free Velocity workspace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  {...register('first_name', { required: 'First name is required' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="First Name"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  {...register('last_name', { required: 'Last name is required' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Last Name"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Phone (optional)"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 -mt-3">
                {errors.password.message}
              </p>
            )}

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="Confirm Password"
              />
              {errors.confirm_password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start text-sm text-gray-600">
              <input
                type="checkbox"
                {...register('terms', { required: 'You must accept the terms' })}
                className="mt-1 mr-2"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-teal-600 font-medium">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-teal-600 font-medium">
                  Privacy Policy
                </Link>
              </span>
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
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - BRANDING PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-teal-800 to-teal-600 text-white p-16 flex-col justify-center">
        <h2 className="text-4xl font-bold leading-tight mb-6">
          Build. Automate. Scale.
        </h2>

        <p className="text-lg opacity-90 mb-8">
          Velocity helps teams streamline workflows, manage workforce operations,
          and grow with confidence.
        </p>

        <div className="border-t border-white/30 pt-6">
          <p className="text-sm opacity-80">
            Join growing organizations building smarter systems.
          </p>
        </div>
      </div>
    </div>
  )

}

export default Register
