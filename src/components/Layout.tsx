import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../store/uiStore'

const Layout = () => {
  const location = useLocation()
  const isWorkflowPage = location.pathname.includes('/workflow')
  const { sidebarCollapsed } = useUIStore()
  
  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className={`flex-1 ${isWorkflowPage ? 'p-0' : 'p-6'} overflow-auto`}>
          <div className={`${isWorkflowPage ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
