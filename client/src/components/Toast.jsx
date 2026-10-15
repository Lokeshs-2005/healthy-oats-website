import { CheckCircle } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const Toast = () => {
  const { toast } = useCart()

  if (!toast) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 px-4"
    >
      <div className="flex items-center gap-2 rounded-full bg-deep-green px-5 py-3 text-sm font-medium text-white shadow-xl">
        <CheckCircle size={18} />
        <span>{toast}</span>
      </div>
    </div>
  )
}

export default Toast
