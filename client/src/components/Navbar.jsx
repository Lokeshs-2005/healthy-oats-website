import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, MessageCircle } from 'lucide-react'
import { publicApi } from '../services/api'
import { DEFAULT_SETTINGS } from '../config/constants'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Our Menu' },
    { to: '/our-story', label: 'Our Story' },
    { to: '/contact', label: 'Contact' },
  ]

  const handleWhatsAppClick = () => {
    if (settings.whatsappNumber) {
      const url = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`
      window.open(url, '_blank')
    }
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-deep-green">
              {settings.brandName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-deep-green'
                      : 'text-gray-600 hover:text-deep-green'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {settings.whatsappNumber && (
              <button
                onClick={handleWhatsAppClick}
                className="btn-secondary flex items-center gap-2"
              >
                <MessageCircle size={18} />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-deep-green"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-deep-green bg-deep-green/5'
                        : 'text-gray-600 hover:text-deep-green hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {settings.whatsappNumber && (
                <button
                  onClick={() => {
                    handleWhatsAppClick()
                    setIsOpen(false)
                  }}
                  className="mx-4 btn-secondary flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
