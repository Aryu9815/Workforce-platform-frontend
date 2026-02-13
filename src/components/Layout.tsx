import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useEffect, useState } from 'react'

const Layout = () => {
  const location = useLocation()
  const isWorkflowPage = location.pathname.includes('/workflow')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen')
    if (stored !== null) setSidebarOpen(stored === 'true')
    const handler = (e: any) => {
      if (e?.detail?.sidebarOpen !== undefined) {
        setSidebarOpen(e.detail.sidebarOpen)
      }
    }
    window.addEventListener('sidebar-toggle', handler as EventListener)
    return () => window.removeEventListener('sidebar-toggle', handler as EventListener)
  }, [])
  
  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      {sidebarOpen && <Sidebar />}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
