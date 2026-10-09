export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const CURRENCY = 'INR'
export const CURRENCY_SYMBOL = '₹'

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

// Default site settings (fallback values)
export const DEFAULT_SETTINGS = {
  brandName: 'Healthy Oats',
  heroHeadline: 'Fuel Your Day, One Cup at a Time',
  heroDescription: 'Discover delicious oatmeal cups made with oats, fruits, nuts, and your favorite toppings.',
  aboutText: 'We started with a simple idea: make enjoyable oatmeal cups and convenient breakfast options accessible to people with busy, active lifestyles. Our menu brings together oats, fruits, nuts, and a variety of toppings so customers can explore combinations that suit their preferences.',
  businessPhone: '',
  whatsappNumber: '',
  businessEmail: '',
  businessAddress: '',
  openingHours: 'Mon-Sat: 7:00 AM - 10:00 PM',
  instagramUrl: '',
  googleMapsUrl: '',
  swiggyUrl: '',
  zomatoUrl: '',
  deliveryAnnouncementText: 'Online ordering is coming soon.',
  showDeliverySection: true,
}

export const PRODUCT_CATEGORIES = {
  CLASSIC: 'classic-oats',
  FRUIT: 'fruit-oats',
  NUTTY: 'nutty-oats',
  OVERNIGHT: 'overnight-oats',
  FITNESS: 'fitness-oats',
  CUSTOM: 'custom-oats',
  ADDONS: 'add-ons',
}
