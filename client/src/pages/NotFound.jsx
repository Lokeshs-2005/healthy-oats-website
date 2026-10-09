import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-deep-green mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
