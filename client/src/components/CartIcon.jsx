import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const CartIcon = () => {
  const { getCartCount } = useCart()
  const count = getCartCount()

  return (
    <Link
      to="/cart"
      className="relative p-2 hover:bg-sage-green/10 rounded-lg transition-colors"
      aria-label="Shopping cart"
    >
      <ShoppingCart size={24} className="text-deep-green" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-warm-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export default CartIcon
