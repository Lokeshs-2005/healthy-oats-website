import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import { publicApi, adminApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await publicApi.getCategories()
      setCategories(response.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData(category)
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, formData)
      } else {
        await adminApi.createCategory(formData)
      }
      handleCancel()
      await loadCategories()
    } catch (err) {
      alert('Failed to save category: ' + err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      await loadCategories()
    } catch (err) {
      alert('Failed to delete category: ' + err.message)
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
    return <ErrorMessage message={error} onRetry={loadCategories} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep-green mb-2">Categories</h1>
        <p className="text-gray-600">Organize your products into categories</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="input"
                placeholder="classic-oats"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div>
              <label className="label">Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                className="input"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-deep-green"
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                {editingCategory ? 'Update' : 'Create'} Category
              </button>
              {editingCategory && (
                <button type="button" onClick={handleCancel} className="btn-outline">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">All Categories</h2>
          {categories.length === 0 ? (
            <EmptyState title="No categories yet" description="Create your first category to get started" />
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deletingCategory && (
        <ConfirmDialog
          title="Delete Category"
          message={`Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  )
}

export default CategoriesManagement
