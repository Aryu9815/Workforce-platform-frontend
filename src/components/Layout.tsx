import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../store/uiStore'

const Layout = () => {
  const location = useLocation()
  const isWorkflowPage = location.pathname.includes('/workflow')
  const { sidebarCollapsed } = useUIStore()
  console.log('isWorkflowPage', isWorkflowPage)
  return (
    <div className="min-h-screen bg-secondary-50 flex w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main
          className={`flex-1 min-w-0 ${isWorkflowPage ? 'p-0' : 'p-6'}`}
          style={{
            overflowX: isWorkflowPage ? "hidden" : "auto",  // 🚫 no horizontal scroll
            overflowY: "auto",                              // vertical scroll allowed
            width: "100%",                                  // ensure no expansion
            maxWidth: "100%",                               // prevent expansion
          }}
        >

          <div className={`${isWorkflowPage ? 'w-full h-full' : 'max-w-7xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
