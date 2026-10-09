import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { publicApi, adminApi } from '../../services/api'
import { DEFAULT_SETTINGS } from '../../config/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const SettingsManagement = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await publicApi.getSiteSettings()
      setSettings({ ...DEFAULT_SETTINGS, ...response.data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage('')
      
      await adminApi.updateSiteSettings(settings)
      setSuccessMessage('Settings updated successfully!')
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep-green mb-2">Settings</h1>
        <p className="text-gray-600">Configure your website settings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Brand Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Hero Headline</label>
              <input
                type="text"
                value={settings.heroHeadline}
                onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Hero Description</label>
              <textarea
                value={settings.heroDescription}
                onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div>
              <label className="label">About Text</label>
              <textarea
                value={settings.aboutText}
                onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
                className="input"
                rows="5"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Business Phone</label>
              <input
                type="tel"
                value={settings.businessPhone}
                onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                className="input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="label">WhatsApp Number (with country code)</label>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="input"
                placeholder="919876543210"
              />
            </div>

            <div>
              <label className="label">Business Email</label>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Opening Hours</label>
              <input
                type="text"
                value={settings.openingHours}
                onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Business Address</label>
              <textarea
                value={settings.businessAddress}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                className="input"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Social Media & Links */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Social Media & Links</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Instagram URL</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                className="input"
                placeholder="https://instagram.com/yourbrand"
              />
            </div>

            <div>
              <label className="label">Google Maps URL</label>
              <input
                type="url"
                value={settings.googleMapsUrl}
                onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
                className="input"
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </div>

        {/* Delivery Platforms */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Platforms</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Swiggy Listing URL</label>
              <input
                type="url"
                value={settings.swiggyUrl}
                onChange={(e) => setSettings({ ...settings, swiggyUrl: e.target.value })}
                className="input"
                placeholder="https://www.swiggy.com/..."
              />
            </div>

            <div>
              <label className="label">Zomato Listing URL</label>
              <input
                type="url"
                value={settings.zomatoUrl}
                onChange={(e) => setSettings({ ...settings, zomatoUrl: e.target.value })}
                className="input"
                placeholder="https://www.zomato.com/..."
              />
            </div>

            <div>
              <label className="label">Delivery Announcement Text</label>
              <input
                type="text"
                value={settings.deliveryAnnouncementText}
                onChange={(e) => setSettings({ ...settings, deliveryAnnouncementText: e.target.value })}
                className="input"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDeliverySection"
                checked={settings.showDeliverySection}
                onChange={(e) => setSettings({ ...settings, showDeliverySection: e.target.checked })}
                className="w-4 h-4 text-deep-green"
              />
              <label htmlFor="showDeliverySection" className="text-sm">Show delivery section on homepage</label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsManagement
