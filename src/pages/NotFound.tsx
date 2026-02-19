import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        
        {/* 404 */}
        <h1 className="text-8xl font-extrabold text-teal-700">404</h1>

        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Page Not Found
        </h2>

        <p className="text-gray-500 mt-3">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>

          <Link
            to="/"
            className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
