import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ size = 'medium', message = '' }) => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} animate-spin text-deep-green`} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
