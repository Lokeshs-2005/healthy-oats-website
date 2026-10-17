import { useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { adminApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'

const ProductFormModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    imageUrl: '',
    isAvailable: true,
  })
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        basePrice: product.basePrice || '',
        imageUrl: product.imageUrl || '',
        isAvailable: product.isAvailable !== false,
      })
    }
  }, [product])

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataImage = new FormData()
      formDataImage.append('image', file)

      const response = await adminApi.uploadImage(formDataImage)
      setFormData({ ...formData, imageUrl: response.data.url })
    } catch (error) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      const data = {
        ...formData,
        slug: generateSlug(formData.name),
        basePrice: parseFloat(formData.basePrice),
      }

      if (product) {
        await adminApi.updateProduct(product.id, data)
      } else {
        await adminApi.createProduct(data)
      }

      onSave()
    } catch (error) {
      alert('Failed to save product: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-deep-green">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="productForm">
            {/* Product Name */}
            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input"
                placeholder="Banana Oats Cup"
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="input"
                rows="5"
                placeholder="Describe your product..."
              />
            </div>

            {/* Price */}
            <div>
              <label className="label">Price ({CURRENCY_SYMBOL}) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
                className="input"
                placeholder="99.00"
              />
            </div>

            {/* Image */}
            <div>
              <label className="label">Product Image *</label>
              <div className="flex gap-4 items-start">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Product"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="mainImage"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="mainImage"
                    className="btn-outline cursor-pointer inline-flex items-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Upload size={20} />
                    )}
                    {formData.imageUrl ? 'Change Image' : 'Upload Image'}
                  </label>
                  {!formData.imageUrl && (
                    <p className="text-sm text-gray-500 mt-2">Required field</p>
                  )}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-medium">Available for purchase</span>
              </label>
            </div>
          </form>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="productForm"
              className="btn-primary flex items-center gap-2"
              disabled={saving || uploading || !formData.imageUrl}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductFormModal
