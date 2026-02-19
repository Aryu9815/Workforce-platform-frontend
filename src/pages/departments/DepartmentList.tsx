import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2
} from 'lucide-react'
import { departmentApi } from '../../api/department'

const DepartmentList = () => {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="text-center text-gray-500 py-16">
          Loading departments...
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Departments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization's departments
          </p>
        </div>

        <Link
          to="/departments/new"
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-2 border-0 border-b border-gray-300 focus:border-emerald-600 focus:ring-0 text-sm outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600">
                Department Name
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">
                Code
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">
                Description
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">
                Staff
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredDepartments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50 transition">

                {/* Name */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  {dept.name}
                </td>

                {/* Code */}
                <td className="px-6 py-4 text-gray-700">
                  {dept.code || '-'}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                  {dept.description || '-'}
                </td>

                {/* Staff Count */}
                <td className="px-6 py-4 text-gray-700">
                  {dept.staff_count || 0}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`text-sm font-medium ${
                      dept.is_active
                        ? 'text-emerald-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-4">

                    <Link
                      to={`/departments/${dept.id}/edit`}
                      className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 transition"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this department?')) {
                          deleteMutation.mutate(dept.id)
                        }
                      }}
                      className="flex items-center text-sm text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>

                  </div>
                </td>

              </tr>
            ))}

            {filteredDepartments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No departments found
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

    </div>
  )
}

export default DepartmentList
