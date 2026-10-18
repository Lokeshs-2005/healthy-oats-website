import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Home, ShoppingBag, Download } from 'lucide-react'
import { useCart, getItemUnitPrice } from '../contexts/CartContext'
import { CURRENCY_SYMBOL } from '../config/constants'

const OrderSuccessPage = () => {
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState(null)
  const cartCleared = useRef(false)
  const orderNumber = sessionStorage.getItem('lastOrderNumber')

  useEffect(() => {
    document.title = 'Order Placed Successfully - Healthy Oats'
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    const checkoutDataStr = sessionStorage.getItem('checkoutData')
    
    if (checkoutDataStr) {
      try {
        setOrderDetails(JSON.parse(checkoutDataStr))
      } catch (e) {
        console.error('Failed to parse checkout data:', e)
      }
    }

    if (!cartCleared.current) {
      cartCleared.current = true
      clearCart()
      sessionStorage.removeItem('orderIdempotencyKey')
    }
  }, [clearCart])

  useEffect(() => {
    if (!orderNumber) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [orderNumber, navigate])

  const handleDownloadOrder = () => {
    if (!orderDetails || !orderNumber) return
    
    const orderInfo = `
ORDER CONFIRMATION
==================

Order Number: ${orderNumber}
Date: ${new Date().toLocaleDateString()}

CUSTOMER DETAILS
----------------
Name: ${orderDetails.fullName}
Email: ${orderDetails.email}
Phone: ${orderDetails.phone}
Address: ${orderDetails.address}, ${orderDetails.city}, ${orderDetails.state} - ${orderDetails.pincode}

ITEMS ORDERED
-------------
${orderDetails.cart?.map((item, i) => 
  `${i + 1}. ${item.name}${item.selectedQuantity ? ` (${item.selectedQuantity})` : ''} x ${item.quantity} - ${CURRENCY_SYMBOL}${getItemUnitPrice(item) * item.quantity}`
).join('\n') || 'No items'}

PAYMENT
-------
Total: ${CURRENCY_SYMBOL}${orderDetails.total}
Method: ${orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}

Thank you for your order!
Healthy Oats
    `.trim()

    const blob = new Blob([orderInfo], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-${orderNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!orderNumber) {
    return (
      <div className="py-16 bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No order information found</p>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 md:py-16 bg-gradient-to-br from-cream via-sage-green/5 to-warm-orange/5">
      <div className="container-custom max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-xl">
            <CheckCircle size={56} className="text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
            Order Placed Successfully!
          </h1>

          <div className="inline-flex flex-col items-center bg-gradient-to-br from-deep-green to-sage-green text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
            <p className="text-sm opacity-90 mb-1">Order Number</p>
            <p className="text-2xl md:text-3xl font-bold tracking-wider">{orderNumber}</p>
          </div>

          <p className="text-gray-700 mb-6">
            Thank you for your order! We'll contact you shortly.
          </p>
        </div>

        {orderDetails && (
          <div className="card p-6 mb-6 bg-white shadow-xl">
            <h2 className="text-xl font-bold text-deep-green mb-4">Order Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{orderDetails.fullName}</p>
                <p className="text-sm text-gray-600">{orderDetails.email} • {orderDetails.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="text-sm">
                  {orderDetails.address}, {orderDetails.city}, {orderDetails.state} - {orderDetails.pincode}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold">
                  {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
                </p>
              </div>
            </div>

            {orderDetails.cart && orderDetails.cart.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-3">Items ({orderDetails.cart.length})</h3>
                <div className="space-y-2">
                  {orderDetails.cart.map((item, index) => (
                    <div key={item.cartItemId || index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.selectedQuantity && `${item.selectedQuantity} • `}Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-deep-green">
                        {CURRENCY_SYMBOL}{getItemUnitPrice(item) * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold text-deep-green">
                <span>Total</span>
                <span>{CURRENCY_SYMBOL}{orderDetails.total}</span>
              </div>
            </div>

            <button
              onClick={handleDownloadOrder}
              className="btn-outline w-full mt-6 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Order Details
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
            <Home size={20} />
            Back to Home
          </Link>

          <Link to="/menu" className="btn-outline flex-1 flex items-center justify-center gap-2 py-4">
            <ShoppingBag size={20} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
