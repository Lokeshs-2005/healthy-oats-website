import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Sparkles, Heart, Clock, Award, Leaf, CheckCircle } from 'lucide-react'
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
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)

  useEffect(() => {
    document.title = `${DEFAULT_SETTINGS.brandName} - Fuel Your Day`
    window.scrollTo(0, 0) // Scroll to top
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [settingsRes] = await Promise.all([
        publicApi.getSiteSettings(),
      ])
      
      setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.data })
      
      // Get all available products and sort by displayOrder
      const allProductsRes = await publicApi.getProducts({ available: true })
      const allProducts = allProductsRes.data || []
      
      // Sort by displayOrder (lower first) and take first 6
      const sortedProducts = allProducts.sort((a, b) => {
        const orderA = a.displayOrder !== undefined ? a.displayOrder : 999
        const orderB = b.displayOrder !== undefined ? b.displayOrder : 999
        return orderA - orderB
      })
      
      setProducts(sortedProducts.slice(0, 6))
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
      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-cream via-sage-green/10 to-warm-orange/10 py-16 md:py-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-green/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-warm-orange/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container-custom relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Sparkles className="w-4 h-4 text-warm-orange" />
                <span className="text-sm font-medium text-deep-green">Oatmeal cups & toppings</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-deep-green leading-tight">
                {settings.heroHeadline}
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-xl">
                {settings.heroDescription}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/menu" className="btn-primary group inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
                  Explore Our Menu
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {settings.googleMapsUrl && (
                  <button onClick={handleMapClick} className="btn-outline flex items-center justify-center gap-2">
                    <MapPin size={20} />
                    Find Our Stall
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-deep-green">100%</div>
                  <div className="text-sm text-gray-600">Natural</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-deep-green">Fresh</div>
                  <div className="text-sm text-gray-600">Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-deep-green">Fast</div>
                  <div className="text-sm text-gray-600">Service</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image - Shows on all devices */}
            <div className="relative mt-8 md:mt-0">
              <div className="relative aspect-square max-w-md mx-auto md:max-w-none">
                {/* Background decoration - only on desktop */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-sage-green/30 to-warm-orange/30 rounded-[3rem] rotate-6"></div>
                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-warm-orange/30 to-sage-green/30 rounded-[3rem] -rotate-6"></div>
                
                {/* Main content with hero image */}
                <div className="relative bg-white rounded-2xl md:rounded-[3rem] shadow-xl md:shadow-2xl overflow-hidden h-full">
                  <img 
                    src="/heroImage.png"
                    alt="Delicious healthy oatmeal cups and bowls"
                    className="w-full h-full object-cover"
                    loading="eager"
                    onLoad={() => setHeroImageLoaded(true)}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      setHeroImageLoaded(false)
                    }}
                    style={{ display: heroImageLoaded ? 'block' : 'none' }}
                  />
                  {/* Fallback if image fails to load */}
                  {!heroImageLoaded && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sage-green/30 to-warm-orange/30">
                      <span className="text-9xl">🥣</span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-green/20 via-transparent to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Enhanced */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-sage-green/10 px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4 text-warm-orange" fill="currentColor" />
              <span className="text-sm font-medium text-deep-green">Customer Favorites</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
              Featured Menu Items
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handcrafted oatmeal combinations that our customers love
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link to="/menu" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                  View Full Menu
                  <ArrowRight size={22} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Benefits Section - Why Choose Healthy Oats */}
      <section className="py-16 bg-gradient-to-br from-sage-green/5 to-warm-orange/5">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
              Why Choose Healthy Oats?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nourishing bowls crafted with care, every single time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Leaf, 
                title: 'Fresh & Natural', 
                desc: 'Made with premium quality oats and wholesome ingredients.' 
              },
              { 
                icon: Clock, 
                title: 'Made to Order', 
                desc: 'Every bowl is prepared fresh the moment you place your order.' 
              },
              { 
                icon: Heart, 
                title: 'Nutritious', 
                desc: 'Packed with fiber, vitamins, and nutrients to fuel your day.' 
              },
              { 
                icon: CheckCircle, 
                title: 'Quality Ingredients', 
                desc: 'We source only the best ingredients for a clean, healthy meal.' 
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Enhanced */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
              Why Choose Healthy Oats?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to quality, freshness, and your satisfaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: <Award className="w-8 h-8" />, 
                bgColor: 'from-blue-500/10 to-blue-600/10',
                iconColor: 'text-blue-600',
                title: 'Premium Quality', 
                desc: 'Only the finest organic oats and ingredients' 
              },
              { 
                icon: <Heart className="w-8 h-8" />, 
                bgColor: 'from-red-500/10 to-pink-600/10',
                iconColor: 'text-red-600',
                title: 'Made with Love', 
                desc: 'Fresh, handcrafted combinations daily' 
              },
              { 
                icon: <Clock className="w-8 h-8" />, 
                bgColor: 'from-orange-500/10 to-amber-600/10',
                iconColor: 'text-orange-600',
                title: 'Quick Service', 
                desc: 'Perfect for your busy morning routine' 
              },
              { 
                icon: <Sparkles className="w-8 h-8" />, 
                bgColor: 'from-purple-500/10 to-pink-600/10',
                iconColor: 'text-purple-600',
                title: 'Fully Custom', 
                desc: 'Create your perfect combination every time' 
              },
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-sage-green/30">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${item.bgColor} ${item.iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-deep-green mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery CTA - Enhanced */}
      {settings.showDeliverySection && (
        <section className="py-16 bg-gradient-to-br from-deep-green to-sage-green text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="container-custom relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Order Online, Delivered Fresh
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Enjoy your favorite oatmeal cups delivered right to your doorstep
            </p>
            
            {settings.swiggyUrl || settings.zomatoUrl ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {settings.swiggyUrl && (
                  <a
                    href={settings.swiggyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-deep-green px-8 py-4 rounded-full font-semibold hover:bg-cream transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
                  >
                    <span className="text-2xl">🛵</span>
                    Order on Swiggy
                  </a>
                )}
                {settings.zomatoUrl && (
                  <a
                    href={settings.zomatoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-warm-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-600 transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
                  >
                    <span className="text-2xl">🍽️</span>
                    Order on Zomato
                  </a>
                )}
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <p className="text-xl mb-6 opacity-90">
                  Order directly from our menu. Fresh bowls, made to order.
                </p>
                <Link
                  to="/menu"
                  className="bg-white text-deep-green px-8 py-4 rounded-full font-semibold hover:bg-cream transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
                >
                  Order from our menu
                  <ArrowRight size={20} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

const ProductCard = ({ product, index }) => {
  return (
    <Link 
      to={`/menu/${product.slug}`} 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-sage-green/10 to-warm-orange/10 overflow-hidden">
        {product.imageUrl ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-green/80 via-deep-green/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">🥣</span>
          </div>
        )}
        
        {/* Badge - if product is featured */}
        {product.isFeatured && (
          <div className="absolute top-4 right-4 bg-warm-orange text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" fill="currentColor" />
            Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-xl text-deep-green mb-2 group-hover:text-sage-green transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-deep-green">
              {CURRENCY_SYMBOL}{product.basePrice}
            </span>
            {product.servingSize && (
              <span className="text-xs text-gray-500 ml-2">/ {product.servingSize}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sage-green group-hover:text-warm-orange transition-colors">
            <span className="text-sm font-medium">View Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default HomePage
