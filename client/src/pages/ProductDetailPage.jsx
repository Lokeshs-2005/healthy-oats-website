import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react'
import { publicApi } from '../services/api'
import { CURRENCY_SYMBOL } from '../config/constants'
import { useCart } from '../contexts/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const ProductDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const productRes = await publicApi.getProductBySlug(slug)
      
      setProduct(productRes.data)
      document.title = `${productRes.data.name} - Healthy Oats`
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, [])
  }

  const handleBuyNow = () => {
    addToCart(product, quantity, [])
    navigate('/checkout')
  }

  const incrementQuantity = () => setQuantity(q => q + 1)
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage 
          message={error || 'Product not found'} 
          onRetry={() => navigate('/menu')} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container-custom">
        {/* Back Button */}
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-deep-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          Back to Menu
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl">🥣</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
              {product.name}
            </h1>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-deep-green">
                {CURRENCY_SYMBOL}{product.basePrice}
              </span>
            </div>

            {!product.isAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-medium">Currently Unavailable</p>
              </div>
            )}

            <p className="text-lg text-gray-700 mb-8 leading-relaxed">{product.description}</p>

            {/* Action Buttons */}
            {product.isAvailable && (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <label className="font-semibold">Quantity:</label>
                  <div 
                    role="group" 
                    aria-label={`Quantity for ${product.name}`}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                  >
                    <button
                      onClick={decrementQuantity}
                      className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={20} />
                    </button>
                    
                    <span className="w-12 text-center font-semibold text-lg" aria-live="polite" aria-atomic="true">{quantity}</span>
                    
                    <button
                      onClick={incrementQuantity}
                      className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={handleBuyNow}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    Buy Now - {CURRENCY_SYMBOL}{product.basePrice * quantity}
                  </button>

                  <button
                    onClick={handleAddToCart}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
