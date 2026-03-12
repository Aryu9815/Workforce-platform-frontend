import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Briefcase
} from 'lucide-react'
import { staffApi } from '../../api/staff'
import { Staff } from '../../types'
import { useAuthStore } from '../../store/authStore'

const StaffList = () => {
  const getPermissions = useAuthStore(state => state.getPermissions)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, search, departmentFilter],
    queryFn: () => staffApi.getStaffList({
      page,
      page_size: 20,
      search: search || undefined,
      department_id: departmentFilter || undefined,
    }),
  })
  
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.getDepartments(),
  })
  
  
  const canViewStaff = getPermissions('staff:view')
  const canCreateStaff = getPermissions('staff:create')

  if (!canViewStaff) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">You do not have permission to view staff.</p>
      </div>
    )
  }

 return (
  <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-medium text-gray-900">Staff</h1>
        <p className="text-sm text-gray-500">
          Manage staff members in your organization
        </p>
      </div>

      {canCreateStaff && (
        <Link
          to="/staff/new"
          className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Link>
      )}
    </div>

    {/* Filters */}
    <div className="border border-gray-200 rounded-md p-4 bg-white">
      <div className="flex flex-wrap gap-6 items-center">

        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-2 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm outline-none"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="w-56">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full py-2 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm outline-none"
          >
            <option value="">All Departments</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>

    {/* Table */}
    <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left font-medium text-gray-600">
              Employee
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-600">
              Contact
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-600">
              Department
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-600">
              Designation
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-600">
              Status
            </th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : data?.items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No staff members found
              </td>
            </tr>
          ) : (
            data?.items.map((staff: Staff) => (
              <tr key={staff.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium text-sm">
                      {staff.first_name[0]}
                      {staff.last_name[0]}
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900">
                        {staff.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {staff.employee_code || 'No ID'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {staff.email}
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {staff.phone}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-gray-700">
                  {staff.department_name || 'N/A'}
                </td>

                <td className="px-6 py-4 text-gray-700">
                  {staff.designation_name || 'N/A'}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-medium ${
                      staff.is_active
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/staff/${staff.id}`}
                    className="p-2 rounded-md hover:bg-gray-100 transition"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    {(data?.pages || 1) > 1 && (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page {page} of {data?.pages || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min((data?.pages || 1), p + 1))}
            disabled={page >= (data?.pages || 1)}
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    )}

  </div>
)


}

export default StaffList
