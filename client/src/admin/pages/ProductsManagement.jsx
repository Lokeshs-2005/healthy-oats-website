import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, GripVertical } from 'lucide-react'
import { publicApi, adminApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ProductFormModal from '../components/ProductFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

const ProductsManagement = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const productsRes = await publicApi.getProducts()

      setProducts(productsRes.data || [])
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

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newProducts = [...filteredProducts]
    const draggedItem = newProducts[draggedIndex]
    newProducts.splice(draggedIndex, 1)
    newProducts.splice(index, 0, draggedItem)

    // Update local state immediately for visual feedback
    setProducts(newProducts)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return
    
    try {
      setReordering(true)
      // Update display order for all products based on new positions
      const updates = filteredProducts.map((product, index) => 
        adminApi.updateProduct(product.id, { displayOrder: index })
      )
      await Promise.all(updates)
      await loadData()
    } catch (err) {
      alert('Failed to reorder products: ' + err.message)
      await loadData() // Reload to reset if failed
    } finally {
      setDraggedIndex(null)
      setReordering(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
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
          {reordering && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 text-blue-700 text-sm">
              Saving new order...
            </div>
          )}
          <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600">
            <GripVertical size={16} className="inline mr-2" />
            Drag rows to reorder products (affects display on menu and homepage)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
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
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    draggable={!reordering}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    <td className="px-2 py-4 text-center">
                      <GripVertical size={18} className="text-gray-400 mx-auto" />
                    </td>
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
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </div>
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
                          disabled={reordering}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                          disabled={reordering}
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
