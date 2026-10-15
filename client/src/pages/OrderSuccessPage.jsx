import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, Mail, Home, ShoppingBag, Phone, Clock, CreditCard, Copy, Check } from 'lucide-react'
import { useCart, getItemUnitPrice } from '../contexts/CartContext'
import { CURRENCY_SYMBOL, DEFAULT_SETTINGS } from '../config/constants'
import { publicApi } from '../services/api'

const OrderSuccessPage = () => {
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(true)
  const cartCleared = useRef(false)
  const orderNumber = sessionStorage.getItem('lastOrderNumber')

  useEffect(() => {
    document.title = 'Order Placed Successfully - Healthy Oats'
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    const checkoutDataStr = sessionStorage.getItem('checkoutData')
    const emailSentStatus = sessionStorage.getItem('lastOrderEmailSent')
    
    if (checkoutDataStr) {
      try {
        setOrderDetails(JSON.parse(checkoutDataStr))
      } catch (e) {
        console.error('Failed to parse checkout data:', e)
      }
    }
    
    setEmailSent(emailSentStatus === 'true')

    if (!cartCleared.current) {
      cartCleared.current = true
      clearCart()
      sessionStorage.removeItem('orderIdempotencyKey')
    }

    publicApi.getSiteSettings()
      .then((response) => setSettings({ ...DEFAULT_SETTINGS, ...response.data }))
      .catch(() => {})
  }, [clearCart])

  useEffect(() => {
    if (!orderNumber) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [orderNumber, navigate])

  const handleCopyOrderNumber = async () => {
    if (!orderNumber) return
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
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

  const supportPhone = settings.businessPhone || '+91 70265 63874'
  const supportEmail = settings.businessEmail || 'healthyoatsgg@gmail.com'

  return (
    <div className="py-10 md:py-16 bg-gradient-to-br from-cream via-sage-green/5 to-warm-orange/5">
      <div className="container-custom max-w-4xl pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-xl">
            <CheckCircle size={56} className="text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-deep-green mb-4">
            Order placed successfully
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-6">
            Thank you for choosing Healthy Oats
          </p>

          <div className="inline-flex flex-col items-center bg-gradient-to-br from-deep-green to-sage-green text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
            <p className="text-sm opacity-90 mb-1">Your order number</p>
            <p className="text-2xl md:text-3xl font-bold tracking-wider">{orderNumber}</p>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="mt-3 inline-flex items-center gap-2 text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy order number'}
            </button>
          </div>

          <p className="text-gray-600">
            Save this number for tracking and support
          </p>
        </div>

        {/* Email Failure Warning */}
        {!emailSent && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow">
            <p className="text-yellow-800 font-semibold mb-1">⚠️ Email Notification Not Sent</p>
            <p className="text-sm text-yellow-700">
              We could not send a confirmation email. Please save your order number: <strong>{orderNumber}</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              You can contact us at {supportPhone} or {supportEmail} to check your order status.
            </p>
          </div>
        )}

        {orderDetails && (
          <div className="card p-5 md:p-6 mb-6 bg-white shadow-xl">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-deep-green">Order summary</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2">
                  <Package className="text-sage-green" size={20} />
                  Delivery details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {orderDetails.fullName}</p>
                  <p><strong>Email:</strong> {orderDetails.email}</p>
                  <p><strong>Phone:</strong> {orderDetails.phone}</p>
                  <p>
                    <strong>Address:</strong><br />
                    {orderDetails.address}<br />
                    {orderDetails.city}, {orderDetails.state} - {orderDetails.pincode}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="text-sage-green" size={20} />
                  Payment details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Method:</strong> {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      orderDetails.paymentMethod === 'cod'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {orderDetails.paymentMethod === 'cod' ? 'Pay on delivery' : 'Pending verification'}
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

            {orderDetails.cart && orderDetails.cart.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-base md:text-lg mb-3">
                  Items ordered ({orderDetails.cart.length})
                </h3>
                <div className="space-y-3">
                  {orderDetails.cart.map((item, index) => (
                    <div key={item.cartItemId || index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🥣</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {item.selectedAddOns?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.selectedAddOns.map((addon) => addon.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-deep-green">
                          {CURRENCY_SYMBOL}{getItemUnitPrice(item) * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card p-5 md:p-6 mb-6 bg-white shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold text-deep-green mb-6 flex items-center gap-2">
            <Clock size={24} />
            What happens next?
          </h2>

          <div className="space-y-6">
            {[
              {
                n: 1,
                color: 'from-blue-500 to-blue-600',
                title: 'Confirmation email',
                body: 'You will receive an email with your order details in a few minutes. Check inbox and spam.',
              },
              {
                n: 2,
                color: 'from-orange-500 to-orange-600',
                title: 'Order verification',
                body: orderDetails?.paymentMethod === 'upi'
                  ? 'Our team will verify your UPI payment and confirm the order.'
                  : 'Our team will review and confirm your order shortly.',
              },
              {
                n: 3,
                color: 'from-purple-500 to-purple-600',
                title: 'Fresh preparation',
                body: 'We prepare your order with fresh ingredients, made to order.',
              },
              {
                n: 4,
                color: 'from-green-500 to-green-600',
                title: 'Delivery',
                body: 'Your order will be delivered to the address you provided.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-lg font-bold shadow-md`}>
                    {step.n}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-base md:text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex gap-3">
              <Mail className="text-blue-600 flex-shrink-0" size={28} />
              <div>
                <h3 className="font-bold mb-2 text-blue-900">Check your email</h3>
                <p className="text-sm text-blue-800">
                  We sent a confirmation to <strong>{orderDetails?.email || 'your email'}</strong>.
                  If you do not see it, check spam or junk.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex gap-3">
              <Phone className="text-green-600 flex-shrink-0" size={28} />
              <div>
                <h3 className="font-bold mb-2 text-green-900">Need help?</h3>
                <p className="text-sm text-green-800 mb-2">Contact us anytime:</p>
                <p className="text-sm font-semibold text-green-900">
                  <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="hover:underline">{supportPhone}</a>
                  <br />
                  <a href={`mailto:${supportEmail}`} className="hover:underline">{supportEmail}</a>
                </p>
              </div>
            </div>
          </div>
        </div>

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
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
