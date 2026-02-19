// // components/staff/StaffForm.tsx

// import { useEffect, useState } from 'react'

// interface OptionType {
//   id: string
//   name: string
// }

// interface StaffFormProps {
//   defaultValues?: any
//   onSubmit: (data: any) => void
//   isEdit?: boolean
//   loading?: boolean
//   departments: OptionType[]
//   designations: OptionType[]
//   dropdownLoading?: boolean
// }

// const StaffForm = ({
//   defaultValues,
//   onSubmit,
//   isEdit = false,
//   loading = false,
//   departments,
//   designations,
//   dropdownLoading = false,
// }: StaffFormProps) => {
//   const [form, setForm] = useState({
//     employee_code: '',
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone: '',
//     department_id: '',
//     designation_id: '',
//     reporting_manager_id: '',
//     employment_type: 'full_time',
//     join_date: '',
//     work_location: '',
//     skills: [] as string[],
//     is_active: true,
//   })

//   // ✅ Apply default values (Edit Mode)
//   useEffect(() => {
//     if (defaultValues) {
//       setForm(prev => ({
//         ...prev,
//         ...defaultValues,
//         department_id: defaultValues.department_id || '',
//         designation_id: defaultValues.designation_id || '',
//         skills: defaultValues.skills || [],
//         join_date: defaultValues.join_date
//           ? defaultValues.join_date.slice(0, 10)
//           : '',
//       }))
//     }
//   }, [defaultValues])

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target

//     setForm(prev => ({
//       ...prev,
//       [name]:
//         type === 'checkbox'
//           ? (e.target as HTMLInputElement).checked
//           : value,
//     }))
//   }

//   const handleSkillsChange = (value: string) => {
//     setForm(prev => ({
//       ...prev,
//       skills: value
//         .split(',')
//         .map(s => s.trim())
//         .filter(Boolean),
//     }))
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSubmit(form)
//   }

//   return (
//     <form onSubmit={handleSubmit} className="card space-y-6 p-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//         <input
//           name="employee_code"
//           placeholder="Employee Code"
//           value={form.employee_code}
//           onChange={handleChange}
//           className="input"
//         />

//         <input
//           name="first_name"
//           placeholder="First Name"
//           value={form.first_name}
//           onChange={handleChange}
//           required
//           className="input"
//         />

//         <input
//           name="last_name"
//           placeholder="Last Name"
//           value={form.last_name}
//           onChange={handleChange}
//           required
//           className="input"
//         />

//         {!isEdit && (
//           <input
//             name="email"
//             type="email"
//             placeholder="Official Email"
//             value={form.email}
//             onChange={handleChange}
//             required
//             className="input"
//           />
//         )}

//         <input
//           name="phone"
//           placeholder="Phone"
//           value={form.phone}
//           onChange={handleChange}
//           className="input"
//         />

//         {/* ✅ Department Dropdown */}
//         <select
//           name="department_id"
//           value={form.department_id}
//           onChange={handleChange}
//           required
//           disabled={dropdownLoading}
//           className="input"
//         >
//           <option value="">Select Department</option>
//           {departments.map(dep => (
//             <option key={dep.id} value={dep.id}>
//               {dep.name}
//             </option>
//           ))}
//         </select>

//         {/* ✅ Designation Dropdown */}
//         <select
//           name="designation_id"
//           value={form.designation_id}
//           onChange={handleChange}
//           required
//           disabled={dropdownLoading}
//           className="input"
//         >
//           <option value="">Select Designation</option>
//           {designations.map(des => (
//             <option key={des.id} value={des.id}>
//               {des.name}
//             </option>
//           ))}
//         </select>

//         <input
//           type="date"
//           name="join_date"
//           value={form.join_date}
//           onChange={handleChange}
//           required
//           className="input"
//         />

//         <input
//           name="work_location"
//           placeholder="Work Location"
//           value={form.work_location}
//           onChange={handleChange}
//           className="input"
//         />

//         <select
//           name="employment_type"
//           value={form.employment_type}
//           onChange={handleChange}
//           className="input"
//         >
//           <option value="full_time">Full Time</option>
//           <option value="contractor">Contractor</option>
//           <option value="vendor">Vendor</option>
//         </select>

//         <input
//           name="reporting_manager_id"
//           placeholder="Reporting Manager ID"
//           value={form.reporting_manager_id}
//           onChange={handleChange}
//           className="input"
//         />
//       </div>

//       {/* Skills */}
//       <input
//         placeholder="Skills (comma separated)"
//         value={form.skills.join(', ')}
//         onChange={(e) => handleSkillsChange(e.target.value)}
//         className="input"
//       />

//       {/* Active Toggle (Edit Mode Only) */}
//       {isEdit && (
//         <label className="flex items-center space-x-2">
//           <input
//             type="checkbox"
//             name="is_active"
//             checked={form.is_active}
//             onChange={handleChange}
//           />
//           <span>Active</span>
//         </label>
//       )}

//       <div className="flex justify-end">
//         <button
//           type="submit"
//           disabled={loading}
//           className="btn-primary"
//         >
//           {loading
//             ? 'Saving...'
//             : isEdit
//             ? 'Update Staff'
//             : 'Create Staff'}
//         </button>
//       </div>
//     </form>
//   )
// }

// export default StaffForm

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

  const inputClass =
    "border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"

  const labelClass =
    "text-sm font-medium text-gray-700"

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* PERSONAL INFORMATION */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-6">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Employee Code</label>
            <input
              name="employee_code"
              value={form.employee_code}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              className={inputClass}
            />
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
                required
                className={inputClass}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Phone</label>
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-6">
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
              required
              disabled={dropdownLoading}
              className={inputClass}
            >
              <option value="">Select Department</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              name="designation_id"
              value={form.designation_id}
              onChange={handleChange}
              required
              disabled={dropdownLoading}
              className={inputClass}
            >
              <option value="">Select Designation</option>
              {designations.map(des => (
                <option key={des.id} value={des.id}>
                  {des.name}
                </option>
              ))}
            </select>
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
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Work Location</label>
            <input
              name="work_location"
              value={form.work_location}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Employment Type</label>
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
            <label className={labelClass}>Reporting Manager ID</label>
            <input
              name="reporting_manager_id"
              value={form.reporting_manager_id}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

        </div>
      </div>

      {/* SKILLS */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
          Skills
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
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition"
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
