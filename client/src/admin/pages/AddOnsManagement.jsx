import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { publicApi, adminApi } from '../../services/api'
import { CURRENCY_SYMBOL } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

const AddOnsManagement = () => {
  const [addOns, setAddOns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingAddOn, setEditingAddOn] = useState(null)
  const [deletingAddOn, setDeletingAddOn] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    additionalPrice: 0,
    allergens: '',
    isAvailable: true,
  })

  useEffect(() => {
    loadAddOns()
  }, [])

  const loadAddOns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await publicApi.getAddOns()
      setAddOns(response.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (addOn) => {
    setEditingAddOn(addOn)
    setFormData(addOn)
  }

  const handleCancel = () => {
    setEditingAddOn(null)
    setFormData({
      name: '',
      description: '',
      additionalPrice: 0,
      allergens: '',
      isAvailable: true,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        additionalPrice: parseFloat(formData.additionalPrice),
      }

      if (editingAddOn) {
        await adminApi.updateAddOn(editingAddOn.id, data)
      } else {
        await adminApi.createAddOn(data)
      }
      handleCancel()
      await loadAddOns()
    } catch (err) {
      alert('Failed to save add-on: ' + err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteAddOn(deletingAddOn.id)
      setDeletingAddOn(null)
      await loadAddOns()
    } catch (err) {
      alert('Failed to delete add-on: ' + err.message)
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
    return <ErrorMessage message={error} onRetry={loadAddOns} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep-green mb-2">Add-ons</h1>
        <p className="text-gray-600">Manage toppings and extras for products</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add-on Form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAddOn ? 'Edit Add-on' : 'Add New Add-on'}
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
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="2"
              />
            </div>

            <div>
              <label className="label">Additional Price ({CURRENCY_SYMBOL})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.additionalPrice}
                onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Allergen Information</label>
              <input
                type="text"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                className="input"
                placeholder="e.g., Contains nuts"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-deep-green"
              />
              <label htmlFor="isAvailable" className="text-sm">Available</label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                {editingAddOn ? 'Update' : 'Create'} Add-on
              </button>
              {editingAddOn && (
                <button type="button" onClick={handleCancel} className="btn-outline">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Add-ons List */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">All Add-ons</h2>
          {addOns.length === 0 ? (
            <EmptyState title="No add-ons yet" description="Create your first add-on to get started" />
          ) : (
            <div className="space-y-2">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{addOn.name}</div>
                    {addOn.description && (
                      <div className="text-sm text-gray-500">{addOn.description}</div>
                    )}
                    <div className="text-sm text-deep-green font-medium mt-1">
                      {addOn.additionalPrice > 0 
                        ? `+${CURRENCY_SYMBOL}${addOn.additionalPrice}` 
                        : 'Free'}
                    </div>
                    {!addOn.isAvailable && (
                      <span className="text-xs text-gray-500">Unavailable</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(addOn)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingAddOn(addOn)}
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
      {deletingAddOn && (
        <ConfirmDialog
          title="Delete Add-on"
          message={`Are you sure you want to delete "${deletingAddOn.name}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingAddOn(null)}
        />
      )}
    </div>
  )
}

export default AddOnsManagement
