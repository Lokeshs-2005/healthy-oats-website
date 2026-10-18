import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MapPin, ShoppingBag, CreditCard } from 'lucide-react'
import { useCart, getItemUnitPrice } from '../contexts/CartContext'
import { publicApi, getApiError } from '../services/api'
import { CURRENCY_SYMBOL, DEFAULT_SETTINGS } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const getIdempotencyKey = () => {
  let key = sessionStorage.getItem('orderIdempotencyKey')
  if (!key) {
    key = crypto.randomUUID()
    sessionStorage.setItem('orderIdempotencyKey', key)
  }
  return key
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, getCartTotal, getCartCount } = useCart()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod', // 'cod' or 'upi'
    notes: '',
    shareLocation: false,
    latitude: null,
    longitude: null
  })
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    document.title = 'Checkout - Healthy Oats'
    window.scrollTo(0, 0)
    publicApi.getSiteSettings()
      .then((response) => setSettings({ ...DEFAULT_SETTINGS, ...response.data }))
      .catch(() => {})

    if (cart.length === 0) {
      navigate('/cart')
    }
  }, [cart, navigate])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleLocationShare = () => {
    if (!formData.shareLocation) {
      // User wants to share location
      setLocationError('')
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              shareLocation: true,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }))
            setLocationError('')
          },
          (error) => {
            console.error('Geolocation error:', error)
            setLocationError('Unable to get location. Please enable location services.')
            setFormData(prev => ({ ...prev, shareLocation: false }))
          }
        )
      } else {
        setLocationError('Location sharing not supported by your browser.')
        setFormData(prev => ({ ...prev, shareLocation: false }))
      }
    } else {
      // User wants to unshare location
      setFormData(prev => ({
        ...prev,
        shareLocation: false,
        latitude: null,
        longitude: null
      }))
      setLocationError('')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      // Remove all non-digit characters for validation
      const phoneDigits = formData.phone.replace(/[^0-9]/g, '')
      // Accept 10 digits (without country code) or 12 digits (with country code like 91)
      if (phoneDigits.length !== 10 && phoneDigits.length !== 12) {
        newErrors.phone = 'Enter valid phone number (10 digits or with country code)'
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits'
    }

    if (!formData.shareLocation) {
      newErrors.shareLocation = 'Please share your location for accurate delivery'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstField = document.getElementById(Object.keys(newErrors)[0])
      firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstField?.focus()
    }
    return Object.keys(newErrors).length === 0
  }

  const persistCheckoutData = (pricing) => {
    sessionStorage.setItem('checkoutData', JSON.stringify({
      ...formData,
      cart,
      ...pricing,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      const subtotal = getCartTotal()
      const deliveryCharge = 0 // Free delivery
      const total = subtotal
      const pricing = { subtotal, deliveryCharge, total }
      persistCheckoutData(pricing)

      if (formData.paymentMethod === 'upi') {
        getIdempotencyKey()
        navigate('/payment/upi')
      } else {
        const orderData = {
          customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            latitude: formData.latitude,
            longitude: formData.longitude,
          },
          items: cart,
          pricing,
          payment: {
            method: 'cod',
          },
          notes: formData.notes,
          idempotencyKey: getIdempotencyKey(),
        }

        const response = await publicApi.createOrder(orderData)
        sessionStorage.setItem('lastOrderNumber', response.data.orderNumber)
        sessionStorage.setItem('lastOrderEmail', formData.email)
        sessionStorage.setItem('lastOrderEmailSent', response.data.emailStatus?.customer ? 'true' : 'false')
        navigate('/order-success')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setSubmitError(getApiError(error, 'Failed to place order. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return null // Will redirect
  }

  const subtotal = getCartTotal()
  const total = subtotal // Free delivery, no additional charges

  return (
    <div className="min-h-screen py-16 bg-gray-50">
      <div className="container-custom">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-deep-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User size={24} className="text-deep-green" />
                  Customer Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`input ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`input ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="+91 9876543210"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={24} className="text-deep-green" />
                  Delivery Address
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Street Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`input ${errors.address ? 'border-red-500' : ''}`}
                      placeholder="House/Flat no., Building name, Street"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* Location Sharing */}
                  <div className="border-t pt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shareLocation}
                        onChange={handleLocationShare}
                        className="mt-1 w-5 h-5 text-deep-green focus:ring-deep-green rounded"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-deep-green">
                          Share Live Location *
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Share your exact location for accurate delivery
                        </p>
                        {formData.shareLocation && formData.latitude && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            ✓ Location captured successfully
                          </p>
                        )}
                      </div>
                    </label>
                    {(errors.shareLocation || locationError) && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.shareLocation || locationError}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`input ${errors.city ? 'border-red-500' : ''}`}
                        placeholder="City"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`input ${errors.state ? 'border-red-500' : ''}`}
                        placeholder="State"
                      />
                      {errors.state && (
                        <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className={`input ${errors.pincode ? 'border-red-500' : ''}`}
                        placeholder="6-digit pincode"
                      />
                      {errors.pincode && (
                        <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={24} className="text-deep-green" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.paymentMethod === 'cod' ? 'border-deep-green bg-deep-green/5' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">Cash on Delivery</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.paymentMethod === 'upi' ? 'border-deep-green bg-deep-green/5' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">Pay with UPI</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="card p-6">
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Special Instructions or Add-ons (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Any add-ons or special instructions for your order?"
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    Processing...
                  </>
                ) : (
                  <>
                    {formData.paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 lg:sticky lg:top-24 bg-white shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 pb-4 border-b">
                <ShoppingBag size={20} className="text-deep-green" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.cartItemId || item.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🥣
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2 mb-1">
                        {item.name}
                        {item.selectedQuantity && <span className="text-gray-600"> – {item.selectedQuantity}</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {CURRENCY_SYMBOL}{getItemUnitPrice(item)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-deep-green">
                        {CURRENCY_SYMBOL}{getItemUnitPrice(item) * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL}{subtotal}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 bg-green-50 -mx-6 px-6 border-y border-green-100">
                  <span className="text-green-700 font-medium text-sm">🚚 Delivery</span>
                  <span className="text-green-700 font-bold text-base">FREE</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-deep-green">{CURRENCY_SYMBOL}{subtotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
