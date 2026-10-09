import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Phone, Mail, MapPin } from 'lucide-react'
import { publicApi } from '../services/api'
import { DEFAULT_SETTINGS } from '../config/constants'

const Footer = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await publicApi.getSiteSettings()
      setSettings({ ...DEFAULT_SETTINGS, ...response.data })
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-deep-green text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">{settings.brandName}</h3>
            <p className="text-gray-300 mb-4">
              Delicious oatmeal cups and healthy snacks for your active lifestyle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-white transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/our-story" className="text-gray-300 hover:text-white transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {settings.businessPhone && (
                <li className="flex items-start gap-2">
                  <Phone size={18} className="mt-1 flex-shrink-0" />
                  <a href={`tel:${settings.businessPhone}`} className="text-gray-300 hover:text-white">
                    {settings.businessPhone}
                  </a>
                </li>
              )}
              {settings.businessEmail && (
                <li className="flex items-start gap-2">
                  <Mail size={18} className="mt-1 flex-shrink-0" />
                  <a href={`mailto:${settings.businessEmail}`} className="text-gray-300 hover:text-white">
                    {settings.businessEmail}
                  </a>
                </li>
              )}
              {settings.businessAddress && (
                <li className="flex items-start gap-2">
                  <MapPin size={18} className="mt-1 flex-shrink-0" />
                  <span className="text-gray-300">{settings.businessAddress}</span>
                </li>
              )}
              {settings.instagramUrl && (
                <li className="flex items-start gap-2">
                  <Instagram size={18} className="mt-1 flex-shrink-0" />
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    Follow us on Instagram
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {currentYear} {settings.brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
