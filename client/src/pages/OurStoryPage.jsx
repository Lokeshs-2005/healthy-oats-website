import { useEffect, useState } from 'react'
import { publicApi } from '../services/api'
import { DEFAULT_SETTINGS } from '../config/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const OurStoryPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Our Story - Healthy Oats'
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-green mb-8 text-center">
            Our Story
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {settings.aboutText}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="card p-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-gray-600">
                  To make healthy, convenient breakfast options accessible to everyone with busy, active lifestyles.
                </p>
              </div>

              <div className="card p-6">
                <div className="text-4xl mb-4">💚</div>
                <h3 className="text-xl font-semibold mb-2">Our Values</h3>
                <p className="text-gray-600">
                  Quality ingredients, customer satisfaction, and transparency in everything we serve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OurStoryPage
