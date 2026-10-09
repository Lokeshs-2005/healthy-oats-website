import { useEffect, useState } from 'react'
import { Phone, Mail, MapPin, Instagram, Clock, MessageCircle } from 'lucide-react'
import { publicApi } from '../services/api'
import { DEFAULT_SETTINGS } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const ContactPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Contact Us - Healthy Oats'
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await publicApi.getSiteSettings()
      setSettings({ ...DEFAULT_SETTINGS, ...response.data })
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (settings.whatsappNumber) {
      const url = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`
      window.open(url, '_blank')
    }
  }

  const handleMapClick = () => {
    if (settings.googleMapsUrl) {
      window.open(settings.googleMapsUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600">
            We'd love to hear from you. Reach out to us through any of these channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-6">
            {settings.businessPhone && (
              <ContactItem
                icon={Phone}
                title="Phone"
                content={settings.businessPhone}
                link={`tel:${settings.businessPhone}`}
              />
            )}

            {settings.whatsappNumber && (
              <ContactItem
                icon={MessageCircle}
                title="WhatsApp"
                content={settings.whatsappNumber}
                onClick={handleWhatsAppClick}
                isButton
              />
            )}

            {settings.businessEmail && (
              <ContactItem
                icon={Mail}
                title="Email"
                content={settings.businessEmail}
                link={`mailto:${settings.businessEmail}`}
              />
            )}

            {settings.businessAddress && (
              <ContactItem
                icon={MapPin}
                title="Address"
                content={settings.businessAddress}
                onClick={settings.googleMapsUrl ? handleMapClick : undefined}
                isButton={!!settings.googleMapsUrl}
              />
            )}

            {settings.openingHours && (
              <ContactItem
                icon={Clock}
                title="Opening Hours"
                content={settings.openingHours}
              />
            )}

            {settings.instagramUrl && (
              <ContactItem
                icon={Instagram}
                title="Instagram"
                content="Follow us on Instagram"
                link={settings.instagramUrl}
                external
              />
            )}
          </div>

          {/* Map or Image Placeholder */}
          <div className="card overflow-hidden">
            {settings.googleMapsUrl ? (
              <div 
                className="aspect-square bg-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={handleMapClick}
              >
                <MapPin size={48} className="text-deep-green mb-4" />
                <p className="text-center font-medium mb-2">Visit Our Stall</p>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Click to open in Google Maps
                </p>
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-cream to-sage-green/30 flex items-center justify-center">
                <span className="text-9xl">🥣</span>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-gray-600 mb-6">
              Feel free to reach out through WhatsApp for quick responses or call us directly during business hours.
            </p>
            {settings.whatsappNumber && (
              <button onClick={handleWhatsAppClick} className="btn-primary">
                <MessageCircle size={20} className="inline mr-2" />
                Message Us on WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ContactItem = ({ icon: Icon, title, content, link, external, onClick, isButton }) => {
  const ContentWrapper = isButton ? 'button' : link ? 'a' : 'div'
  
  const props = {
    ...(link && { href: link }),
    ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
    ...(onClick && { onClick }),
    ...(isButton && { className: 'text-left w-full' }),
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="bg-deep-green/10 p-3 rounded-lg">
          <Icon className="text-deep-green" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <ContentWrapper 
            {...props}
            className={`text-gray-600 ${(link || isButton) ? 'hover:text-deep-green transition-colors' : ''}`}
          >
            {content}
          </ContentWrapper>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
