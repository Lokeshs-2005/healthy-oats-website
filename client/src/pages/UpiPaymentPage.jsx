import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, CheckCircle, ExternalLink, Smartphone } from 'lucide-react'
import { publicApi } from '../services/api'
import { CURRENCY_SYMBOL } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const UpiPaymentPage = () => {
  const navigate = useNavigate()
  const [checkoutData, setCheckoutData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // UPI Details
  const UPI_ID = '8217563874-6@ybl' // PhonePe UPI ID
  const UPI_QR_URL = '/upi-qr-code.png' // QR code image in public folder

  useEffect(() => {
    document.title = 'UPI Payment - Healthy Oats'
    window.scrollTo(0, 0) // Scroll to top
    
    // Load checkout data from sessionStorage
    const savedData = sessionStorage.getItem('checkoutData')
    if (!savedData) {
      // Redirect to checkout if no data found
      navigate('/checkout')
      return
    }

    try {
      setCheckoutData(JSON.parse(savedData))
    } catch (error) {
      console.error('Error parsing checkout data:', error)
      navigate('/checkout')
    }
  }, [navigate])

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateUpiDeepLink = () => {
    if (!checkoutData) return '#'
    
    // UPI deep link format
    const params = new URLSearchParams({
      pa: UPI_ID, // Payee address (UPI ID)
      pn: 'Healthy Oats', // Payee name
      am: checkoutData.total.toString(), // Amount
      cu: 'INR', // Currency
      tn: `Order Payment - ${checkoutData.fullName}` // Transaction note
    })

    return `upi://pay?${params.toString()}`
  }

  const handlePayNow = () => {
    // Open UPI app
    const deepLink = generateUpiDeepLink()
    window.location.href = deepLink
  }

  const handleConfirmPayment = async () => {
    setLoading(true)

    try {
      // Place order in database with "pending_verification" payment status
      const orderData = {
        customer: {
          fullName: checkoutData.fullName,
          email: checkoutData.email,
          phone: checkoutData.phone,
          address: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          pincode: checkoutData.pincode,
        },
        items: checkoutData.cart,
        pricing: {
          subtotal: checkoutData.subtotal,
          deliveryCharge: checkoutData.deliveryCharge,
          total: checkoutData.total,
        },
        payment: {
          method: 'upi',
        },
        notes: checkoutData.notes || '',
      }

      // Place order via API
      const response = await publicApi.createOrder(orderData)
      console.log('Order placed with pending payment:', response.data)
      
      // Store order number for success page
      sessionStorage.setItem('lastOrderNumber', response.data.orderNumber)
      
      // Clear checkout data
      sessionStorage.removeItem('checkoutData')
      
      // Navigate to success page
      navigate('/order-success')
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container-custom max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-2 text-deep-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          Back to Checkout
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-8">
          UPI Payment
        </h1>

        {/* Payment Amount Card */}
        <div className="card mb-6 bg-gradient-to-br from-deep-green to-green-700 text-white">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Amount to Pay</p>
            <p className="text-5xl font-bold">
              {CURRENCY_SYMBOL}{checkoutData.total}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">How to Pay via UPI</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>
                Click the "Pay Now" button below to open your UPI app directly
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>
                Or scan the QR code using any UPI app (PhonePe, Google Pay, Paytm, etc.)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>
                Complete the payment in your UPI app
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <span>
                Come back and click "I've Completed Payment" button below
              </span>
            </li>
          </ol>
        </div>

        {/* UPI QR Code */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Scan QR Code</h2>
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-center">
              <img
                src={UPI_QR_URL}
                alt="UPI QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image not found
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div class="text-center text-gray-500"><p class="text-4xl mb-2">📱</p><p>QR Code will appear here</p></div>'
                }}
              />
            </div>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              Scan with PhonePe, Google Pay, Paytm or any UPI app
            </p>

            {/* UPI ID */}
            <div className="bg-gray-50 rounded-lg p-4 w-full">
              <p className="text-sm text-gray-600 mb-2">Or pay directly to UPI ID:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-2 rounded border text-deep-green font-semibold">
                  {UPI_ID}
                </code>
                <button
                  onClick={handleCopyUpiId}
                  className="btn-outline flex items-center gap-2"
                  title="Copy UPI ID"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Pay Now Button - Opens UPI App */}
          <button
            onClick={handlePayNow}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <Smartphone size={24} />
            Pay Now via UPI App
            <ExternalLink size={20} />
          </button>

          {/* Confirm Payment Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full py-4 text-lg border-2 border-deep-green text-deep-green hover:bg-deep-green hover:text-white transition-colors rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={24} />
                I've Completed Payment
              </>
            )}
          </button>
        </div>

        {/* Important Note */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong className="font-semibold text-yellow-800">Important:</strong> After completing the payment in your UPI app, 
            please return to this page and click the "I've Completed Payment" button. 
            Your order will be confirmed once our team verifies the payment.
          </p>
          <p className="text-sm text-gray-700 mt-2">
            <strong className="font-semibold text-yellow-800">Need Help?</strong> Contact us at{' '}
            <a href="tel:+917026563874" className="text-deep-green font-semibold hover:underline">
              +91 70265 63874
            </a>
          </p>
        </div>

        {/* Order Details Summary */}
        <div className="mt-6 card">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Name:</span>
              <span className="font-medium">{checkoutData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{checkoutData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{checkoutData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{checkoutData.cart.length} items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpiPaymentPage
