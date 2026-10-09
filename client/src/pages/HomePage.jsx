import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { publicApi } from '../services/api'
import { DEFAULT_SETTINGS, CURRENCY_SYMBOL } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

const HomePage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = `${DEFAULT_SETTINGS.brandName} - Fuel Your Day`
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [settingsRes, productsRes] = await Promise.all([
        publicApi.getSiteSettings(),
        publicApi.getProducts({ featured: true, available: true, limit: 6 })
      ])
      
      setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data })
      setProducts(productsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = () => {
    if (settings.googleMapsUrl) {
      window.open(settings.googleMapsUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cream to-sage-green/20 py-16 md:py-24">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-green mb-6">
                {settings.heroHeadline}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                {settings.heroDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/menu" className="btn-primary">
                  Explore Our Menu
                </Link>
                {settings.googleMapsUrl && (
                  <button onClick={handleMapClick} className="btn-outline flex items-center justify-center gap-2">
                    <MapPin size={20} />
                    Find Our Stall
                  </button>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="aspect-square rounded-3xl bg-sage-green/30 flex items-center justify-center">
                <span className="text-6xl">🥣</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
              Featured Menu Items
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Try our most popular oatmeal combinations
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadData} />
          ) : products.length === 0 ? (
            <EmptyState
              title="Menu Coming Soon"
              description="We're preparing our delicious menu. Check back soon!"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
              View Full Menu
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Build Your Bowl */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
              Build Your Perfect Bowl
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Customize your oatmeal cup with your favorite ingredients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🥣</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Choose Your Oats</h3>
              <p className="text-gray-600">Start with classic, overnight, or fitness oats</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🍓</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Add Toppings</h3>
              <p className="text-gray-600">Pick from fruits, nuts, seeds, and more</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Enjoy!</h3>
              <p className="text-gray-600">Fresh, convenient, and delicious</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">
              Why Choose Us?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🌾', title: 'Quality Oats', desc: 'Premium quality ingredients' },
              { icon: '🍎', title: 'Fresh Ingredients', desc: 'Fresh fruits and natural toppings' },
              { icon: '⚡', title: 'Quick & Convenient', desc: 'Perfect for busy lifestyles' },
              { icon: '🎨', title: 'Customizable', desc: 'Create your perfect combination' },
            ].map((item, index) => (
              <div key={index} className="card p-6 text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      {settings.showDeliverySection && (
        <section className="py-16 bg-sage-green/10">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-6">
              Order Online
            </h2>
            {settings.swiggyUrl || settings.zomatoUrl ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {settings.swiggyUrl && (
                  <a
                    href={settings.swiggyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Order on Swiggy
                  </a>
                )}
                {settings.zomatoUrl && (
                  <a
                    href={settings.zomatoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Order on Zomato
                  </a>
                )}
              </div>
            ) : (
              <p className="text-lg text-gray-600">
                {settings.deliveryAnnouncementText}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

const ProductCard = ({ product }) => {
  return (
    <Link to={`/menu/${product.slug}`} className="card overflow-hidden group">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl">🥣</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-deep-green">
            {CURRENCY_SYMBOL}{product.basePrice}
          </span>
          {product.servingSize && (
            <span className="text-sm text-gray-500">{product.servingSize}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default HomePage
