import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, Mail, Home, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const OrderSuccessPage = () => {
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const orderNumber = sessionStorage.getItem('lastOrderNumber')

  useEffect(() => {
    document.title = 'Order Placed Successfully - Healthy Oats'
    window.scrollTo(0, 0) // Scroll to top
    
    // Clear the cart after successful order
    clearCart()
    
    // Clean up sessionStorage
    return () => {
      sessionStorage.removeItem('lastOrderNumber')
      sessionStorage.removeItem('checkoutData')
    }
  }, [clearCart])

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container-custom max-w-2xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle size={56} className="text-green-600" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
            Order Placed Successfully!
          </h1>
          
          {orderNumber && (
            <div className="inline-block bg-deep-green text-white px-6 py-3 rounded-lg mb-4">
              <p className="text-sm opacity-90">Order Number</p>
              <p className="text-2xl font-bold">{orderNumber}</p>
            </div>
          )}
          
          <p className="text-lg text-gray-700 mb-2">
            Thank you for your order
          </p>
          <p className="text-gray-600">
            We've received your order and will process it soon
          </p>
        </div>

        {/* What's Next Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package size={24} className="text-deep-green" />
            What happens next?
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Confirmation Email</h3>
                <p className="text-sm text-gray-600">
                  You'll receive a confirmation email with your order details shortly
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Payment Verification</h3>
                <p className="text-sm text-gray-600">
                  Our team will verify your payment and confirm your order
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Preparation</h3>
                <p className="text-sm text-gray-600">
                  We'll start preparing your fresh, healthy oatmeal cups
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Delivery</h3>
                <p className="text-sm text-gray-600">
                  Your order will be delivered to your doorstep
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Mail className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold mb-1 text-blue-900">Check your email</h3>
              <p className="text-sm text-blue-800">
                We've sent an order confirmation to your email address. Please check your inbox 
                (and spam folder) for details about your order.
              </p>
            </div>
          </div>
        </div>

        {/* Order Tracking Info */}
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your order, please contact us via WhatsApp or email. 
            We're here to help!
          </p>
          <Link
            to="/contact"
            className="btn-outline inline-flex items-center gap-2"
          >
            <Mail size={18} />
            Contact Us
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Back to Home
          </Link>
          
          <Link
            to="/menu"
            className="btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={20} />
            Continue Shopping
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            For order-related queries, please keep your order confirmation email handy
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
