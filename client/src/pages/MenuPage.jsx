import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { publicApi } from '../services/api'
import { CURRENCY_SYMBOL } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

const MenuPage = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    document.title = 'Our Menu - Healthy Oats'
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [productsRes, categoriesRes] = await Promise.all([
        publicApi.getProducts(),
        publicApi.getCategories()
      ])
      
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
      return matchesSearch && matchesCategory && product.isAvailable
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePrice - b.basePrice
      if (sortBy === 'price-desc') return b.basePrice - a.basePrice
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
            Our Menu
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our delicious oatmeal cups and healthy snack options
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadData} />
        ) : (
          <>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12 w-full md:w-96"
                />
              </div>

              {/* Category and Sort Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input"
                  >
                    <option value="name">Name</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6 text-sm text-gray-600">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your search or filters"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const ProductCard = ({ product }) => {
  return (
    <Link to={`/menu/${product.slug}`} className="card overflow-hidden group">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl">🥣</span>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 right-2 bg-warm-orange text-white text-xs font-semibold px-2 py-1 rounded">
            Featured
          </div>
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

export default MenuPage
