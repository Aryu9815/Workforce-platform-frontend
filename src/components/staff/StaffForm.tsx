import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { staffApi } from '../../api/staff'
import toast from 'react-hot-toast'

interface OptionType {
  id: string
  name: string
}

interface StaffFormProps {
  defaultValues?: any
  onSubmit: (data: any, profileImage?: File) => void
  isEdit?: boolean
  loading?: boolean
  departments: OptionType[]
  designations: OptionType[]
  roles?: OptionType[]
  dropdownLoading?: boolean
}

const StaffForm = ({
  defaultValues,
  onSubmit,
  isEdit = false,
  loading = false,
  departments,
  designations,
  roles = [],
  dropdownLoading = false,
}: StaffFormProps) => {

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    designation_id: '',
    role_id: '',
    reporting_manager_id: '',
    employment_type: 'full_time',
    join_date: '',
    work_location: '',
    skills: [] as string[],
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let currentUrl: string | null = null

    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        ...defaultValues,
        department_id: defaultValues.department_id || '',
        designation_id: defaultValues.designation_id || '',
        role_id: defaultValues.role_id || '',
        skills: defaultValues.skills || [],
        join_date: defaultValues.join_date
          ? defaultValues.join_date.slice(0, 10)
          : '',
      }))

      if (defaultValues.profile_image) {
        const fetchExistingImage = async () => {
          try {
            // Extract just the filename if a full path is provided
            const fileNameOnly = defaultValues.profile_image.split(/[/\\]/).pop() || defaultValues.profile_image
            const blob = await staffApi.getProfileImage(fileNameOnly)
            if (!isMounted) return
            
            currentUrl = URL.createObjectURL(blob)
            setImagePreview(currentUrl)
          } catch (error) {
            if (isMounted) {
              console.error('Failed to fetch existing profile image:', error)
            }
          }
        }
        fetchExistingImage()
      }
    }

    return () => {
      isMounted = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [defaultValues])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handleSkillsChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      skills: value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const newErrors: Record<string, string> = {}

    if (!form.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!form.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!isEdit && !form.email.trim()) newErrors.email = 'Email is required'
    if (!form.department_id) newErrors.department_id = 'Department is required'
    if (!form.designation_id) newErrors.designation_id = 'Designation is required'
    if (!form.role_id) newErrors.role_id = 'Role is required'
    if (!form.join_date) newErrors.join_date = 'Join date is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    onSubmit(form, profileImage || undefined)
  }

  const inputClass = "input"
  const labelClass = "label"

  const { data: staffListData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff', 'all-for-manager'],
    queryFn: () =>
      staffApi.getStaffList({
        page: 1,
        page_size: 100,
      }),
  })

  const staffOptions =
    staffListData?.items?.map((s: any) => ({ id: s.id, name: s.full_name })) || []

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* PERSONAL INFORMATION */}
      <div>
        <h2 className="section-title mb-6">
          Personal Information
        </h2>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center sm:flex-row gap-6 mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400">
                  <svg
                    className="w-12 h-12"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition group-hover:scale-110">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">Profile Picture</h3>
            <p className="text-xs text-gray-500 mt-1">
              JPG, GIF or PNG. Max size of 800K
            </p>
            <button
              type="button"
              onClick={() => {
                setProfileImage(null)
                setImagePreview(null)
              }}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-500 transition"
            >
              Remove photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className={`${inputClass} ${errors.first_name ? 'border-red-500' : ''}`}
            />
            {errors.first_name && <p className="error-message">{errors.first_name}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className={`${inputClass} ${errors.last_name ? 'border-red-500' : ''}`}
            />
            {errors.last_name && <p className="error-message">{errors.last_name}</p>}
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>
                Official Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Phone <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

        </div>
      </div>

      {/* EMPLOYMENT INFORMATION */}
      <div>
        <h2 className="section-title mb-6">
          Employment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`${inputClass} ${errors.department_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select Department</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
            {errors.department_id && <p className="error-message">{errors.department_id}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              name="designation_id"
              value={form.designation_id}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`${inputClass} ${errors.designation_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select Designation</option>
              {designations.map(des => (
                <option key={des.id} value={des.id}>
                  {des.name}
                </option>
              ))}
            </select>
            {errors.designation_id && <p className="error-message">{errors.designation_id}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Assign Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              disabled={dropdownLoading}
              className={`${inputClass} ${errors.role_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && <p className="error-message">{errors.role_id}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Join Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="join_date"
              value={form.join_date}
              onChange={handleChange}
              className={`${inputClass} ${errors.join_date ? 'border-red-500' : ''}`}
            />
            {errors.join_date && <p className="error-message">{errors.join_date}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Work Location <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              name="work_location"
              value={form.work_location}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              name="employment_type"
              value={form.employment_type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="full_time">Full Time</option>
              <option value="contractor">Contractor</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Reporting Manager <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <select
              name="reporting_manager_id"
              value={form.reporting_manager_id || ''}
              onChange={handleChange}
              disabled={staffLoading}
              className={inputClass}
            >
              <option value="">None</option>
              {staffOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* SKILLS */}
      <div>
        <h2 className="section-title mb-4">
          Skills <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
        </h2>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Skills (comma separated)
          </label>
          <input
            value={form.skills.join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* ACTIVE TOGGLE (Edit Only) */}
      {isEdit && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600"
          />
          <label className="text-sm text-gray-700">
            Active Employee
          </label>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading
            ? 'Saving...'
            : isEdit
            ? 'Update Staff'
            : 'Create Staff'}
        </button>
      </div>

    </form>
  )
}

export default StaffForm
