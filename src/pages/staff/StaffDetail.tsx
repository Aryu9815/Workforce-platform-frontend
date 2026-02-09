import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Edit,
  Trash2
} from 'lucide-react'
import { staffApi } from '../../api/staff'

const StaffDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getStaff(id!),
    enabled: !!id,
  })
  
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }
  
  if (!staff) {
    return <div className="text-center py-8">Staff not found</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/staff')}
            className="mr-4 p-2 rounded-lg hover:bg-secondary-100"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="page-title">{staff.full_name}</h1>
            <p className="page-description">
              {staff.employee_code || 'No Employee ID'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="btn-danger">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Profile card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start">
            <div className="h-24 w-24 rounded-xl bg-primary-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-700">
                {staff.first_name[0]}{staff.last_name[0]}
              </span>
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">
                    {staff.full_name}
                  </h2>
                  <p className="text-secondary-500">{staff.designation_name || 'No Designation'}</p>
                </div>
                <span className={`badge ${staff.is_active ? 'badge-success' : 'badge-default'}`}>
                  {staff.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-secondary-400 mr-2" />
                  {staff.email}
                </div>
                {staff.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-secondary-400 mr-2" />
                    {staff.phone}
                  </div>
                )}
                {staff.work_location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-secondary-400 mr-2" />
                    {staff.work_location}
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-secondary-400 mr-2" />
                  Joined {new Date(staff.join_date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 text-secondary-400 mr-2" />
                  {staff.department_name || 'No Department'}
                </div>
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 text-secondary-400 mr-2" />
                  {staff.employment_type.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">Skills</h3>
          </div>
          <div className="card-body">
            {staff.skills && staff.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500">No skills listed</p>
            )}
          </div>
        </div>
        
        {/* Certifications */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">Certifications</h3>
          </div>
          <div className="card-body">
            {staff.certifications && staff.certifications.length > 0 ? (
              <ul className="space-y-2">
                {staff.certifications.map((cert, index) => (
                  <li key={index} className="text-sm text-secondary-700">
                    {typeof cert === 'string' ? cert : cert.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary-500">No certifications listed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDetail
