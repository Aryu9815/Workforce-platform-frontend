import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Edit,
  Trash2
} from 'lucide-react'
import { departmentApi } from '../../api/department'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'
import { Button } from '../../components/ui/Button'

const DepartmentList = () => {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getDepartments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const filteredDepartments = departments?.filter(dept =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-description">Manage your organization's departments</p>
        </div>
        <Link to="/departments/new" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Add Department
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Description</th>
              <th>Staff Count</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments?.map((dept) => (
              <tr key={dept.id}>
                <td>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center mr-3">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="font-medium text-secondary-900">{dept.name}</div>
                  </div>
                </td>
                <td>{dept.code || '-'}</td>
                <td className="max-w-xs truncate">{dept.description || '-'}</td>
                <td>{dept.staff_count || 0}</td>
                <td>
                  {dept.is_active ? (
                    <span className="badge-success">Active</span>
                  ) : (
                    <span className="badge-default">Inactive</span>
                  )}
                </td>
                <td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                      <Link to={`/departments/${dept.id}/edit`} className="flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this department?')) {
                          deleteMutation.mutate(dept.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filteredDepartments?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-secondary-500">
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
