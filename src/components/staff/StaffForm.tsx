// components/staff/StaffForm.tsx

import { useEffect, useState } from 'react'

interface OptionType {
  id: string
  name: string
}

interface StaffFormProps {
  defaultValues?: any
  onSubmit: (data: any) => void
  isEdit?: boolean
  loading?: boolean
  departments: OptionType[]
  designations: OptionType[]
  dropdownLoading?: boolean
}

const StaffForm = ({
  defaultValues,
  onSubmit,
  isEdit = false,
  loading = false,
  departments,
  designations,
  dropdownLoading = false,
}: StaffFormProps) => {
  const [form, setForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    designation_id: '',
    reporting_manager_id: '',
    employment_type: 'full_time',
    join_date: '',
    work_location: '',
    skills: [] as string[],
    is_active: true,
  })

  // ✅ Apply default values (Edit Mode)
  useEffect(() => {
    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        ...defaultValues,
        department_id: defaultValues.department_id || '',
        designation_id: defaultValues.designation_id || '',
        skills: defaultValues.skills || [],
        join_date: defaultValues.join_date
          ? defaultValues.join_date.slice(0, 10)
          : '',
      }))
    }
  }, [defaultValues])

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
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
          name="employee_code"
          placeholder="Employee Code"
          value={form.employee_code}
          onChange={handleChange}
          className="input"
        />

        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
          required
          className="input"
        />

        {!isEdit && (
          <input
            name="email"
            type="email"
            placeholder="Official Email"
            value={form.email}
            onChange={handleChange}
            required
            className="input"
          />
        )}

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="input"
        />

        {/* ✅ Department Dropdown */}
        <select
          name="department_id"
          value={form.department_id}
          onChange={handleChange}
          required
          disabled={dropdownLoading}
          className="input"
        >
          <option value="">Select Department</option>
          {departments.map(dep => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>

        {/* ✅ Designation Dropdown */}
        <select
          name="designation_id"
          value={form.designation_id}
          onChange={handleChange}
          required
          disabled={dropdownLoading}
          className="input"
        >
          <option value="">Select Designation</option>
          {designations.map(des => (
            <option key={des.id} value={des.id}>
              {des.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="join_date"
          value={form.join_date}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="work_location"
          placeholder="Work Location"
          value={form.work_location}
          onChange={handleChange}
          className="input"
        />

        <select
          name="employment_type"
          value={form.employment_type}
          onChange={handleChange}
          className="input"
        >
          <option value="full_time">Full Time</option>
          <option value="contractor">Contractor</option>
          <option value="vendor">Vendor</option>
        </select>

        <input
          name="reporting_manager_id"
          placeholder="Reporting Manager ID"
          value={form.reporting_manager_id}
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Skills */}
      <input
        placeholder="Skills (comma separated)"
        value={form.skills.join(', ')}
        onChange={(e) => handleSkillsChange(e.target.value)}
        className="input"
      />

      {/* Active Toggle (Edit Mode Only) */}
      {isEdit && (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <span>Active</span>
        </label>
      )}

      <div className="flex justify-end">
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
