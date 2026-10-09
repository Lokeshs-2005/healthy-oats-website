import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, Star } from 'lucide-react'
import { publicApi, adminApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ProductFormModal from '../components/ProductFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

const ProductsManagement = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productsRes, categoriesRes] = await Promise.all([
        publicApi.getProducts(),
        publicApi.getCategories(),
      ])

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleSave = async () => {
    setShowForm(false)
    setEditingProduct(null)
    await loadData()
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteProduct(deletingProduct.id)
      setDeletingProduct(null)
      await loadData()
    } catch (err) {
      alert('Failed to delete product: ' + err.message)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-deep-green mb-2">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
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
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Create your first product to get started"
          action={
            <button onClick={handleCreate} className="btn-primary mt-4">
              Add Your First Product
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🥣</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && (
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {product.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {categories.find((c) => c.id === product.categoryId)?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {CURRENCY_SYMBOL}{product.basePrice}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          product.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.isAvailable ? (
                          <>
                            <Eye size={12} /> Available
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Unavailable
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {deletingProduct && (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to delete "${deletingProduct.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  )
}

export default ProductsManagement
