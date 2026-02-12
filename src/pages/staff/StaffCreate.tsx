// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useMutation, useQuery } from '@tanstack/react-query'
// import { staffApi } from '../../api/staff'

// const StaffCreate = () => {
//   const navigate = useNavigate()

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
//   })
//     const { data: designations } = useQuery({
//     queryKey: ['designations'],
//     queryFn: staffApi.getDesignations,
//     })
//   const { data: departments } = useQuery({
//     queryKey: ['departments'],
//     queryFn: staffApi.getDepartments,
//   })

//   const createMutation = useMutation({
//     mutationFn: staffApi.createStaff,
//     onSuccess: () => {
//       navigate('/staff')
//     },
//   })

//   const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target
//     setForm(prev => ({ ...prev, [name]: value }))
//   }

//   const onSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     createMutation.mutate({
//       employee_code: form.employee_code || undefined,
//       first_name: form.first_name,
//       last_name: form.last_name,
//       email: form.email,
//       phone: form.phone || undefined,
//       department_id: form.department_id,
//       designation_id: form.designation_id,
//       reporting_manager_id: form.reporting_manager_id || undefined,
//       employment_type: form.employment_type as any,
//       join_date: form.join_date,
//       work_location: form.work_location || undefined,
//       skills: form.skills,
//     })
//   }

//   return (
//     <div className="space-y-6 max-w-3xl">
//       <div>
//         <h1 className="page-title">Add Staff</h1>
//         <p className="page-description">Create a new staff member</p>
//       </div>

//       <form onSubmit={onSubmit} className="card">
//         <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input
//             name="employee_code"
//             placeholder="Employee Code"
//             value={form.employee_code}
//             onChange={onChange}
//             className="input"
//           />

//           <input
//             name="first_name"
//             placeholder="First Name"
//             value={form.first_name}
//             onChange={onChange}
//             required
//             className="input"
//           />

//           <input
//             name="last_name"
//             placeholder="Last Name"
//             value={form.last_name}
//             onChange={onChange}
//             required
//             className="input"
//           />

//           <input
//             name="email"
//             type="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={onChange}
//             required
//             className="input"
//           />

//           <input
//             name="phone"
//             placeholder="Phone"
//             value={form.phone}
//             onChange={onChange}
//             className="input"
//           />

//           <select
//             name="department_id"
//             value={form.department_id}
//             onChange={onChange}
//             required
//             className="input"
//           >
//             <option value="">Select Department</option>
//             {departments?.map(dep => (
//               <option key={dep.id} value={dep.id}>
//                 {dep.name}
//               </option>
//             ))}
//           </select>

//           <select
//             name="designation_id"
//             value={form.designation_id}
//             onChange={onChange}
//             required
//             className="input"
//             >
//             <option value="">Select Designation</option>
//             {designations?.map((des: any) => (
//                 <option key={des.id} value={des.id}>
//                 {des.name}
//                 </option>
//             ))}
//             </select>



//           <input
//             name="reporting_manager_id"
//             placeholder="Reporting Manager ID"
//             value={form.reporting_manager_id}
//             onChange={onChange}
//             className="input"
//           />

//           <select
//             name="employment_type"
//             value={form.employment_type}
//             onChange={onChange}
//             className="input"
//           >
//             <option value="full_time">Full Time</option>
//             <option value="contractor">Contractor</option>
//             <option value="vendor">Vendor</option>
//           </select>

//           <input
//             name="join_date"
//             type="date"
//             value={form.join_date}
//             onChange={onChange}
//             required
//             className="input"
//           />

//           <input
//             name="work_location"
//             placeholder="Work Location"
//             value={form.work_location}
//             onChange={onChange}
//             className="input"
//           />
//         </div>

//         <div className="card-footer flex justify-end gap-2">
//           <button
//             type="button"
//             onClick={() => navigate('/staff')}
//             className="btn-secondary"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={createMutation.isPending}
//             className="btn-primary"
//           >
//             {createMutation.isPending ? 'Creating...' : 'Create Staff'}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }

// export default StaffCreate
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import StaffForm from '../../components/staff/StaffForm'
import { staffApi } from '../../api/staff'
import { departmentApi } from '../../api/department'
import { designationApi } from '../../api/designation'

const StaffCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ✅ Fetch Departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  // ✅ Fetch Designations
  const { data: designations, isLoading: designationsLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationApi.getDesignations(),
  })

  const mutation = useMutation({
    mutationFn: staffApi.createStaff,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      navigate(`/staff/${data.id}`)
    },
  })

  const isLoading = departmentsLoading || designationsLoading

  return (
    <div className="space-y-6">
      <h1 className="page-title">Create Staff</h1>

      <StaffForm
        onSubmit={(data) => mutation.mutate(data)}
        loading={mutation.isPending}
        departments={departments || []}
        designations={designations || []}
        dropdownLoading={isLoading}
      />
    </div>
  )
}

export default StaffCreate
