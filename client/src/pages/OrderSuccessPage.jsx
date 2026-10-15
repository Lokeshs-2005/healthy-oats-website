import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, Mail, Home, ShoppingBag, Phone, Clock, Truck, CreditCard } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { CURRENCY_SYMBOL } from '../config/constants'

const OrderSuccessPage = () => {
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState(null)
  const orderNumber = sessionStorage.getItem('lastOrderNumber')

  useEffect(() => {
    document.title = 'Order Placed Successfully - Healthy Oats'
    window.scrollTo(0, 0) // Scroll to top
    
    // Get checkout data before clearing
    const checkoutDataStr = sessionStorage.getItem('checkoutData')
    if (checkoutDataStr) {
      try {
        const data = JSON.parse(checkoutDataStr)
        setOrderDetails(data)
      } catch (e) {
        console.error('Failed to parse checkout data:', e)
      }
    }
    
    // Clear the cart after successful order
    clearCart()
    
    // Clean up sessionStorage after a delay to allow user to refresh
    const timeout = setTimeout(() => {
      sessionStorage.removeItem('lastOrderNumber')
      sessionStorage.removeItem('checkoutData')
    }, 60000) // Clean up after 1 minute
    
    return () => clearTimeout(timeout)
  }, [clearCart])

  // If no order number, redirect to home
  useEffect(() => {
    if (!orderNumber) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [orderNumber, navigate])

  if (!orderNumber) {
    return (
      <div className="min-h-screen py-16 bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen py-16 bg-gradient-to-br from-cream via-sage-green/5 to-warm-orange/5">
      <div className="container-custom max-w-4xl">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-xl animate-scale-in">
            <CheckCircle size={64} className="text-white" strokeWidth={2.5} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
            🎉 Order Placed Successfully!
          </h1>
          
          <p className="text-xl text-gray-700 mb-6">
            Thank you for choosing Healthy Oats
          </p>

          {/* Order Number Card */}
          <div className="inline-block bg-gradient-to-br from-deep-green to-sage-green text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
            <p className="text-sm opacity-90 mb-1">Your Order Number</p>
            <p className="text-3xl font-bold tracking-wider">{orderNumber}</p>
          </div>

          <p className="text-gray-600">
            Save this order number for tracking and support
          </p>
        </div>

        {/* Order Summary Card */}
        {orderDetails && (
          <div className="card mb-6 bg-white shadow-xl">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-deep-green">Order Summary</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="text-sage-green" size={20} />
                  Delivery Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {orderDetails.fullName}</p>
                  <p><strong>Email:</strong> {orderDetails.email}</p>
                  <p><strong>Phone:</strong> {orderDetails.phone}</p>
                  <p><strong>Address:</strong><br />
                    {orderDetails.address}<br />
                    {orderDetails.city}, {orderDetails.state} - {orderDetails.pincode}
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="text-sage-green" size={20} />
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Method:</strong> {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
                  </p>
                  <p>
                    <strong>Status:</strong> {' '}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      orderDetails.paymentMethod === 'cod' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {orderDetails.paymentMethod === 'cod' ? 'Pending' : 'Pending Verification'}
                    </span>
                  </p>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{CURRENCY_SYMBOL}{orderDetails.subtotal}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium">
                        {orderDetails.deliveryCharge === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `${CURRENCY_SYMBOL}${orderDetails.deliveryCharge}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-deep-green pt-2 border-t">
                      <span>Total:</span>
                      <span>{CURRENCY_SYMBOL}{orderDetails.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Ordered */}
            {orderDetails.cart && orderDetails.cart.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Items Ordered ({orderDetails.cart.length})</h3>
                <div className="space-y-3">
                  {orderDetails.cart.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🥣</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-deep-green">{CURRENCY_SYMBOL}{item.basePrice * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* What's Next Timeline */}
        <div className="card mb-6 bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-deep-green mb-6 flex items-center gap-2">
            <Clock size={24} />
            What Happens Next?
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  1
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg mb-1 text-blue-900">📧 Confirmation Email</h3>
                <p className="text-gray-600">
                  You'll receive an email with your order details within a few minutes. Please check your inbox and spam folder.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  2
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg mb-1 text-orange-900">✅ Order Verification</h3>
                <p className="text-gray-600">
                  {orderDetails?.paymentMethod === 'upi' 
                    ? 'Our team will verify your UPI payment in our bank account and confirm your order.'
                    : 'Our team will review and confirm your order shortly.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  3
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg mb-1 text-purple-900">👨‍🍳 Fresh Preparation</h3>
                <p className="text-gray-600">
                  We'll start preparing your order with fresh, healthy ingredients. Each item is made to order!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                  4
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg mb-1 text-green-900">🚚 Delivery</h3>
                <p className="text-gray-600">
                  Your fresh, delicious order will be delivered to your doorstep. Enjoy your healthy meal!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Email Notice */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex gap-3">
              <Mail className="text-blue-600 flex-shrink-0" size={28} />
              <div>
                <h3 className="font-bold mb-2 text-blue-900">📬 Check Your Email</h3>
                <p className="text-sm text-blue-800">
                  We've sent a confirmation email to <strong>{orderDetails?.email || 'your email'}</strong>. 
                  If you don't see it, please check your spam/junk folder.
                </p>
              </div>
            </div>
          </div>

          {/* Support Notice */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex gap-3">
              <Phone className="text-green-600 flex-shrink-0" size={28} />
              <div>
                <h3 className="font-bold mb-2 text-green-900">💬 Need Help?</h3>
                <p className="text-sm text-green-800 mb-2">
                  Contact us anytime for support:
                </p>
                <p className="text-sm font-semibold text-green-900">
                  📞 +91 70265 63874<br />
                  📧 healthyoatsgg@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Home size={22} />
            Back to Home
          </Link>
          
          <Link
            to="/menu"
            className="btn-outline flex-1 flex items-center justify-center gap-2 py-4 text-lg"
          >
            <ShoppingBag size={22} />
            Continue Shopping
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-lg px-6 py-4 shadow-md">
            <p className="text-sm text-gray-600 mb-2">
              🎁 <strong>Thank you for your order!</strong>
            </p>
            <p className="text-xs text-gray-500">
              Keep your order number <strong className="text-deep-green">{orderNumber}</strong> handy for tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
