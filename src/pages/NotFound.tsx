import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
      <div className="text-center">
        {/* 404 */}
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        
        {/* Message */}
        <h2 className="text-2xl font-bold text-secondary-900 mt-4">
          Page Not Found
        </h2>
        <p className="text-secondary-500 mt-2 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        
        {/* Actions */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <Link to="/" className="btn-primary">
            <Home className="h-5 w-5 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
