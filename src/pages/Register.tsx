import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
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
      <div className="w-full lg:w-5/12 flex items-center justify-center bg-white p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 bg-teal-600 flex items-center justify-center" style={{ borderRadius: '6px' }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Velocity</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Create your account
          </h2>
          <p className="text-sm text-gray-500 mb-7">
            Get started with your free Velocity workspace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input
                  type="text"
                  {...register('first_name', { required: 'Required' })}
                  className={`input ${errors.first_name ? 'input-error' : ''}`}
                  placeholder="First"
                />
                {errors.first_name && (
                  <p className="error-message">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Last name</label>
                <input
                  type="text"
                  {...register('last_name', { required: 'Required' })}
                  className={`input ${errors.last_name ? 'input-error' : ''}`}
                  placeholder="Last"
                />
                {errors.last_name && (
                  <p className="error-message">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Work email</label>
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

            {/* Phone */}
            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Minimum 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                className={`input ${errors.confirm_password ? 'input-error' : ''}`}
                placeholder="Repeat your password"
              />
              {errors.confirm_password && (
                <p className="error-message">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 text-sm text-gray-600">
              <input
                type="checkbox"
                {...(register as any)('terms', { required: 'You must accept the terms' })}
                className="mt-0.5 accent-teal-600"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-teal-600 font-medium hover:text-teal-700">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-teal-600 font-medium hover:text-teal-700">Privacy Policy</Link>
              </span>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:text-teal-700">
              Sign in
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
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
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
            Build. Automate.<br />Scale.
          </h2>

          <p className="text-base text-slate-400 leading-relaxed max-w-sm">
            Velocity helps teams streamline workflows, manage workforce operations, and grow with confidence.
          </p>
        </div>

        <div className="relative border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-500">
            Join growing organizations building smarter systems with Velocity.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
