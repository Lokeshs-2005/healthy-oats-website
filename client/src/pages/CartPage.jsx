import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { publicApi } from '../services/api'
import { CURRENCY_SYMBOL } from '../config/constants'
import EmptyState from '../components/EmptyState'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart()
  const [addOns, setAddOns] = useState([])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
    loadAddOns()
  }, [])

  const loadAddOns = async () => {
    try {
      const response = await publicApi.getAddOns()
      setAddOns(response.data || [])
    } catch (error) {
      console.error('Failed to load add-ons:', error)
    }
  }

  const subtotal = getCartTotal()
  const deliveryCharge = subtotal >= 500 ? 0 : 50 // Free delivery above ₹500
  const total = subtotal + deliveryCharge

  const handleCheckout = () => {
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-16 bg-cream">
        <div className="container-custom">
          <EmptyState
            icon={<ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />}
            title="Your cart is empty"
            description="Add some delicious oatmeal cups to get started!"
          >
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-6">
              Continue to Menu
              <ArrowRight size={20} />
            </Link>
          </EmptyState>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16 bg-cream">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-deep-green mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            {/* Available Add-ons Section */}
            {addOns.length > 0 && (
              <div className="card p-6 bg-gradient-to-br from-sage-green/5 to-warm-orange/5 border-2 border-dashed border-sage-green/30">
                <h3 className="text-xl font-bold text-deep-green mb-3 flex items-center gap-2">
                  ✨ Enhance Your Order with Add-ons
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add these delicious extras to complement your order!
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addOns.filter(addon => addon.isAvailable).slice(0, 6).map((addon) => (
                    <div
                      key={addon.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-sage-green hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-deep-green">
                            {addon.name}
                          </p>
                          {addon.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{addon.description}</p>
                          )}
                        </div>
                        {addon.additionalPrice > 0 && (
                          <span className="text-sage-green font-bold ml-2 text-sm">
                            +{CURRENCY_SYMBOL}{addon.additionalPrice}
                          </span>
                        )}
                      </div>
                      <Link
                        to="/menu"
                        className="text-xs text-sage-green font-medium flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        <span>Browse Products with this Add-on</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                  <p className="text-xs text-amber-800">
                    💡 <strong>How add-ons work:</strong> These are special extras available with certain products. Visit the menu to find products that offer these add-ons, then customize your selection on the product detail page before adding to cart.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold text-deep-green mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL}{subtotal}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charge</span>
                  <span className="font-semibold">
                    {deliveryCharge === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `${CURRENCY_SYMBOL}${deliveryCharge}`
                    )}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-deep-green">
                    <span>Total</span>
                    <span>{CURRENCY_SYMBOL}{total}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <Link
                to="/menu"
                className="btn-outline w-full inline-block text-center py-3"
              >
                Continue to Menu
              </Link>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p>Free delivery on orders above ₹500</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600 mt-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p>Fresh ingredients, made to order</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    } else {
      onRemove(item.id)
    }
  }

  const itemTotal = item.basePrice * item.quantity

  return (
    <div className="card p-4 flex gap-4 relative group">
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Remove item"
      >
        <X size={16} />
      </button>

      {/* Product Image */}
      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🥣
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/menu/${item.slug}`}
          className="font-semibold text-deep-green hover:text-sage-green transition-colors line-clamp-1"
        >
          {item.name}
        </Link>
        
        {item.shortDescription && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {item.shortDescription}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
            <button
              onClick={handleDecrease}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            
            <button
              onClick={handleIncrease}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {CURRENCY_SYMBOL}{item.basePrice} × {item.quantity}
            </p>
            <p className="text-lg font-bold text-deep-green">
              {CURRENCY_SYMBOL}{itemTotal}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
