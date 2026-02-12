import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import TenantSelect from './pages/TenantSelect'
import Dashboard from './pages/Dashboard'
import StaffList from './pages/staff/StaffList'
import StaffCreate from './pages/staff/StaffCreate'
import StaffDetail from './pages/staff/StaffDetail'
import StaffEdit from './pages/staff/StaffEdit'
import DepartmentList from './pages/departments/DepartmentList'
import DepartmentCreate from './pages/departments/DepartmentCreate'
import DepartmentEdit from './pages/departments/DepartmentEdit'
import DesignationList from './pages/designations/DesignationList'
import DesignationCreate from './pages/designations/DesignationCreate'
import DesignationEdit from './pages/designations/DesignationEdit'
import ProjectList from './pages/projects/ProjectList'
import ProjectDetail from './pages/projects/ProjectDetail'
import ProjectCreate from './pages/projects/ProjectCreate'
import TaskList from './pages/tasks/TaskList'
import TaskDetail from './pages/tasks/TaskDetail'
import Attendance from './pages/attendance/Attendance'
import LeaveRequests from './pages/attendance/LeaveRequests'
import InventoryList from './pages/inventory/InventoryList'
import InventoryDetail from './pages/inventory/InventoryDetail'
import ReimbursementList from './pages/reimbursements/ReimbursementList'
import ReimbursementDetail from './pages/reimbursements/ReimbursementDetail'
import NotFound from './pages/NotFound'

function App() {
  const { isAuthenticated, isloggedIn } = useAuthStore()

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }
  
  const LoggedInRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isloggedIn) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
      
      {/* Tenant selection */}
      <Route path="/select-tenant" element={
        <LoggedInRoute>
          <TenantSelect />
        </LoggedInRoute>
      } />

      {/* Protected routes with layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        {/* Staff routes */}
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/new" element={<StaffCreate />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="/staff/:id/edit" element={<StaffEdit />} />

        {/* Department routes */}
        <Route path="departments" element={<DepartmentList />} />
        <Route path="departments/new" element={<DepartmentCreate />} />
        <Route path="departments/:id/edit" element={<DepartmentEdit />} />

        {/* Designation routes */}
        <Route path="designations" element={<DesignationList />} />
        <Route path="designations/new" element={<DesignationCreate />} />
        <Route path="designations/:id/edit" element={<DesignationEdit />} />

        
        {/* Project routes */}
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        
        {/* Task routes */}
        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        
        {/* Attendance routes */}
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance/leave" element={<LeaveRequests />} />
        
        {/* Inventory routes */}
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/:id" element={<InventoryDetail />} />
        
        {/* Reimbursement routes */}
        <Route path="reimbursements" element={<ReimbursementList />} />
        <Route path="reimbursements/:id" element={<ReimbursementDetail />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
