import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, FolderTree, Plus, Eye, EyeOff, Star } from 'lucide-react'
import { publicApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    unavailableProducts: 0,
    featuredProducts: 0,
    totalCategories: 0,
    totalAddOns: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productsRes, categoriesRes, addOnsRes] = await Promise.all([
        publicApi.getProducts(),
        publicApi.getCategories(),
        publicApi.getAddOns(),
      ])

      const products = productsRes.data || []
      const categories = categoriesRes.data || []
      const addOns = addOnsRes.data || []

      setStats({
        totalProducts: products.length,
        availableProducts: products.filter((p) => p.isAvailable).length,
        unavailableProducts: products.filter((p) => !p.isAvailable).length,
        featuredProducts: products.filter((p) => p.isFeatured).length,
        totalCategories: categories.length,
        totalAddOns: addOns.length,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadStats} />
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      title: 'Available Products',
      value: stats.availableProducts,
      icon: Eye,
      color: 'bg-green-500',
      link: '/admin/products',
    },
    {
      title: 'Unavailable Products',
      value: stats.unavailableProducts,
      icon: EyeOff,
      color: 'bg-gray-500',
      link: '/admin/products',
    },
    {
      title: 'Featured Products',
      value: stats.featuredProducts,
      icon: Star,
      color: 'bg-yellow-500',
      link: '/admin/products',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: FolderTree,
      color: 'bg-purple-500',
      link: '/admin/categories',
    },
    {
      title: 'Add-ons',
      value: stats.totalAddOns,
      icon: Plus,
      color: 'bg-orange-500',
      link: '/admin/addons',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep-green mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your website</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/products" className="btn-primary text-center">
            Manage Products
          </Link>
          <Link to="/admin/categories" className="btn-primary text-center">
            Manage Categories
          </Link>
          <Link to="/admin/addons" className="btn-primary text-center">
            Manage Add-ons
          </Link>
          <Link to="/admin/settings" className="btn-primary text-center">
            Update Settings
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
