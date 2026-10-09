import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Package } from 'lucide-react'
import { publicApi } from '../services/api'
import { CURRENCY_SYMBOL, DEFAULT_SETTINGS } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const ProductDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [addOns, setAddOns] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [productRes, addOnsRes, settingsRes] = await Promise.all([
        publicApi.getProductBySlug(slug),
        publicApi.getAddOns(),
        publicApi.getSiteSettings()
      ])
      
      setProduct(productRes.data)
      setAddOns(addOnsRes.data || [])
      setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data })
      document.title = `${productRes.data.name} - Healthy Oats`
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppEnquiry = () => {
    if (settings.whatsappNumber && product) {
      const message = `Hi, I am interested in ${product.name}. Could you share its current availability and details?`
      const url = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    }
  }

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

  const allImages = product.additionalImages?.length 
    ? [product.imageUrl, ...product.additionalImages] 
    : [product.imageUrl]

  const productAddOns = addOns.filter(
    addon => product.addOnIds?.includes(addon.id) && addon.isAvailable
  )

  return (
    <div className="min-h-screen py-12">
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
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
              {allImages[currentImageIndex] ? (
                <img
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl">🥣</span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      currentImageIndex === index
                        ? 'border-deep-green'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-deep-green">
                {CURRENCY_SYMBOL}{product.basePrice}
              </span>
              {product.servingSize && (
                <span className="text-gray-500">{product.servingSize}</span>
              )}
            </div>

            {!product.isAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-medium">Currently Unavailable</p>
              </div>
            )}

            <p className="text-lg text-gray-700 mb-6">{product.description}</p>

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                <p className="text-gray-700">{product.ingredients}</p>
              </div>
            )}

            {/* Allergens */}
            {product.allergens && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Allergen Information</h3>
                <p className="text-gray-700">{product.allergens}</p>
              </div>
            )}

            {/* Nutritional Info */}
            {product.nutritionalInfo && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Nutritional Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {product.nutritionalInfo}
                  </pre>
                </div>
              </div>
            )}

            {/* Storage Instructions */}
            {product.storageInstructions && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Storage Instructions</h3>
                <p className="text-gray-700">{product.storageInstructions}</p>
              </div>
            )}

            {/* Available Add-ons */}
            {productAddOns.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Available Add-ons</h3>
                <div className="space-y-2">
                  {productAddOns.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-sm text-gray-600">{addon.description}</p>
                        )}
                      </div>
                      {addon.additionalPrice > 0 && (
                        <span className="text-deep-green font-semibold">
                          +{CURRENCY_SYMBOL}{addon.additionalPrice}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Enquiry Button */}
            {settings.whatsappNumber && product.isAvailable && (
              <button
                onClick={handleWhatsAppEnquiry}
                className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Enquire on WhatsApp
              </button>
            )}

            {!product.isAvailable && (
              <p className="text-gray-600 mt-4">
                This item is currently unavailable. Please check back later.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
