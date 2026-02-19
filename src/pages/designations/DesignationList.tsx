import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2
} from 'lucide-react'
import { designationApi } from '../../api/designation'
import { departmentApi } from '../../api/department'
import { Button } from '../../components/ui/Button'

const DesignationList = () => {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: designations, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationApi.getDesignations(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => designationApi.deleteDesignation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] })
    },
  })

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return 'N/A'
    return departments?.find(d => d.id === deptId)?.name || 'N/A'
  }

  const filteredDesignations = designations?.filter(desig =>
    desig.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Designations</h1>
          <p className="text-sm text-gray-500">
            Manage staff roles and organizational levels
          </p>
        </div>

        <Link
          to="/designations/new"
          className="flex items-center bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-sm transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Link>
      </div>

      {/* Search */}
      <div className="border border-gray-200 rounded-md p-4 bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search designations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-2 border-0 border-b border-gray-300 focus:border-teal-600 focus:ring-0 text-sm outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Level</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Department</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredDesignations?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No designations found
                </td>
              </tr>
            ) : (
              filteredDesignations?.map((desig) => (
                <tr key={desig.id} className="hover:bg-gray-50 transition">

                  {/* Name */}
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {desig.name}
                  </td>

                  {/* Level */}
                  <td className="px-6 py-4 text-gray-700">
                    {desig.level || '-'}
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-gray-700">
                    {getDepartmentName(desig.department_id)}
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {desig.description || '—'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium ${
                        desig.is_active ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {desig.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions - inline style */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">

                      <Link
                        to={`/designations/${desig.id}/edit`}
                        className="flex items-center gap-1 text-teal-700 hover:text-teal-800 transition text-sm font-medium"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>

                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this designation?')) {
                            deleteMutation.mutate(desig.id)
                          }
                        }}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm font-medium"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default DesignationList
