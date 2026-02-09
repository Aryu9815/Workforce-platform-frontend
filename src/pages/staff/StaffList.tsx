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

const StaffList = () => {
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
  
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="badge-success">Active</span>
    ) : (
      <span className="badge-default">Inactive</span>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-description">Manage your organization's staff members</p>
        </div>
        <Link to="/staff/new" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Add Staff
        </Link>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            {/* Department filter */}
            <div className="w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="input pl-10 appearance-none"
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
        </div>
      </div>
      
      {/* Staff table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Employee</th>
              <th className="table-header-cell">Contact</th>
              <th className="table-header-cell">Department</th>
              <th className="table-header-cell">Designation</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">
                  No staff members found
                </td>
              </tr>
            ) : (
              data?.items.map((staff: Staff) => (
                <tr key={staff.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {staff.first_name[0]}{staff.last_name[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-secondary-900">
                          {staff.full_name}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {staff.employee_code || 'No ID'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-secondary-600">
                        <Mail className="h-4 w-4 mr-1" />
                        {staff.email}
                      </div>
                      {staff.phone && (
                        <div className="flex items-center text-sm text-secondary-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {staff.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-secondary-700">
                      <Building2 className="h-4 w-4 mr-1 text-secondary-400" />
                      {staff.department_name || 'N/A'}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-secondary-700">
                      <Briefcase className="h-4 w-4 mr-1 text-secondary-400" />
                      {staff.designation_name || 'N/A'}
                    </div>
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(staff.is_active)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/staff/${staff.id}`}
                        className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} results
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-600">
              Page {page} of {data.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
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
