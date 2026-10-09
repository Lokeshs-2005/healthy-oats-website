import { useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { adminApi, publicApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'

const ProductFormModal = ({ product, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    basePrice: '',
    servingSize: '',
    ingredients: '',
    allergens: '',
    storageInstructions: '',
    imageUrl: '',
    additionalImages: [],
    addOnIds: [],
    isFeatured: false,
    isAvailable: true,
    nutritionalInfo: '',
    labels: '',
  })
  
  const [addOns, setAddOns] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAddOns()
    if (product) {
      setFormData({
        ...product,
        additionalImages: product.additionalImages || [],
        addOnIds: product.addOnIds || [],
      })
    }
  }, [product])

  const loadAddOns = async () => {
    try {
      const response = await publicApi.getAddOns()
      setAddOns(response.data || [])
    } catch (error) {
      console.error('Failed to load add-ons:', error)
    }
  }

  const handleImageUpload = async (e, isAdditional = false) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataImage = new FormData()
      formDataImage.append('image', file)

      const response = await adminApi.uploadImage(formDataImage)

      if (isAdditional) {
        setFormData({
          ...formData,
          additionalImages: [...formData.additionalImages, response.data.url],
        })
      } else {
        setFormData({ ...formData, imageUrl: response.data.url })
      }
    } catch (error) {
      alert('Failed to upload image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index) => {
    const newImages = formData.additionalImages.filter((_, i) => i !== index)
    setFormData({ ...formData, additionalImages: newImages })
  }

  const handleAddOnToggle = (addOnId) => {
    const newAddOnIds = formData.addOnIds.includes(addOnId)
      ? formData.addOnIds.filter(id => id !== addOnId)
      : [...formData.addOnIds, addOnId]
    
    setFormData({ ...formData, addOnIds: newAddOnIds })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      const data = {
        ...formData,
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
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Product Name *</label>
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
                  placeholder="banana-oats"
                />
              </div>
            </div>

            <div>
              <label className="label">Short Description *</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                required
                className="input"
                placeholder="A brief one-line description"
              />
            </div>

            <div>
              <label className="label">Full Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="input"
                rows="4"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Base Price ({CURRENCY_SYMBOL}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">Serving Size</label>
                <input
                  type="text"
                  value={formData.servingSize}
                  onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                  className="input"
                  placeholder="250g"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Product Details</h3>
            
            <div>
              <label className="label">Ingredients</label>
              <textarea
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="input"
                rows="2"
                placeholder="List the ingredients"
              />
            </div>

            <div>
              <label className="label">Allergen Information</label>
              <input
                type="text"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                className="input"
                placeholder="e.g., Contains nuts, dairy"
              />
            </div>

            <div>
              <label className="label">Storage Instructions</label>
              <input
                type="text"
                value={formData.storageInstructions}
                onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                className="input"
                placeholder="e.g., Refrigerate after opening"
              />
            </div>

            <div>
              <label className="label">Nutritional Information (Optional)</label>
              <textarea
                value={formData.nutritionalInfo}
                onChange={(e) => setFormData({ ...formData, nutritionalInfo: e.target.value })}
                className="input"
                rows="3"
                placeholder="Calories, Protein, Carbs, Fat, etc."
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Images</h3>
            
            <div>
              <label className="label">Main Image</label>
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
                    onChange={(e) => handleImageUpload(e, false)}
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
                </div>
              </div>
            </div>

            <div>
              <label className="label">Additional Images</label>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {formData.additionalImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Additional ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, true)}
                className="hidden"
                id="additionalImages"
                disabled={uploading}
              />
              <label
                htmlFor="additionalImages"
                className="btn-outline cursor-pointer inline-flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
                Add More Images
              </label>
            </div>
          </div>

          {/* Available Add-ons */}
          {addOns.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Available Add-ons</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {addOns.map((addOn) => (
                  <label
                    key={addOn.id}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.addOnIds.includes(addOn.id)}
                      onChange={() => handleAddOnToggle(addOn.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{addOn.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Settings</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Available</span>
              </label>
            </div>
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
              disabled={saving || uploading}
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
