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
    additionalImages: [],
    pricingTiers: [],
    displayOrder: 999,
    isAvailable: true,
  })
  
  const [uploading, setUploading] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        basePrice: product.basePrice || '',
        imageUrl: product.imageUrl || '',
        additionalImages: product.additionalImages || [],
        pricingTiers: product.pricingTiers || [],
        displayOrder: product.displayOrder !== undefined ? product.displayOrder : 999,
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

  const handleAdditionalImageUpload = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingAdditional({ ...uploadingAdditional, [index]: true })
      const formDataImage = new FormData()
      formDataImage.append('image', file)

      const response = await adminApi.uploadImage(formDataImage)
      const newImages = [...formData.additionalImages]
      newImages[index] = response.data.url
      setFormData({ ...formData, additionalImages: newImages })
    } catch (error) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setUploadingAdditional({ ...uploadingAdditional, [index]: false })
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
        displayOrder: parseInt(formData.displayOrder) || 999,
        additionalImages: formData.additionalImages,
        pricingTiers: formData.pricingTiers,
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

            {/* Display Order */}
            <div>
              <label className="label">Display Order</label>
              <input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                className="input"
                placeholder="999"
              />
              <p className="text-sm text-gray-500 mt-1">Lower numbers appear first (0 = top)</p>
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

            {/* Additional Images */}
            <div>
              <label className="label">Additional Images (Optional)</label>
              <p className="text-sm text-gray-500 mb-3">Upload up to 5 additional product images</p>
              <div className="space-y-3">
                {formData.additionalImages.map((url, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    {url && (
                      <img
                        src={url}
                        alt={`Additional ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAdditionalImageUpload(e, index)}
                        className="hidden"
                        id={`additionalImage-${index}`}
                        disabled={uploadingAdditional[index]}
                      />
                      <label
                        htmlFor={`additionalImage-${index}`}
                        className="btn-outline cursor-pointer inline-flex items-center gap-2 flex-1"
                      >
                        {uploadingAdditional[index] ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Upload size={18} />
                        )}
                        {url ? 'Change Image' : 'Upload Image'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = formData.additionalImages.filter((_, i) => i !== index)
                          setFormData({ ...formData, additionalImages: newImages })
                        }}
                        className="btn-outline px-3"
                        title="Remove this image slot"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.additionalImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        additionalImages: [...formData.additionalImages, ''] 
                      })
                    }}
                    className="btn-outline text-sm"
                  >
                    + Add Image Slot
                  </button>
                )}
                {formData.additionalImages.length >= 5 && (
                  <p className="text-xs text-gray-500">Maximum 5 additional images reached</p>
                )}
              </div>
            </div>

            {/* Pricing Tiers */}
            <div>
              <label className="label">Pricing Tiers (Optional)</label>
              <p className="text-sm text-gray-500 mb-3">
                Add multiple quantity/price options (e.g., 250g, 500g, 1kg)
              </p>
              <div className="space-y-2">
                {formData.pricingTiers.map((tier, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tier.quantity}
                      onChange={(e) => {
                        const newTiers = [...formData.pricingTiers]
                        newTiers[index] = { ...newTiers[index], quantity: e.target.value }
                        setFormData({ ...formData, pricingTiers: newTiers })
                      }}
                      className="input flex-1"
                      placeholder="e.g. 250g"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.price}
                      onChange={(e) => {
                        const newTiers = [...formData.pricingTiers]
                        newTiers[index] = { ...newTiers[index], price: e.target.value }
                        setFormData({ ...formData, pricingTiers: newTiers })
                      }}
                      className="input w-32"
                      placeholder="Price"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTiers = formData.pricingTiers.filter((_, i) => i !== index)
                        setFormData({ ...formData, pricingTiers: newTiers })
                      }}
                      className="btn-outline px-3"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                {formData.pricingTiers.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        pricingTiers: [...formData.pricingTiers, { quantity: '', price: '' }] 
                      })
                    }}
                    className="btn-outline text-sm"
                  >
                    + Add Tier
                  </button>
                )}
                {formData.pricingTiers.length >= 10 && (
                  <p className="text-xs text-gray-500">Maximum 10 pricing tiers</p>
                )}
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
              disabled={saving || uploading || Object.values(uploadingAdditional).some(v => v) || !formData.imageUrl}
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
