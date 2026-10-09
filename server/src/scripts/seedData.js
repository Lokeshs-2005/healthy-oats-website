/**
 * Sample Seed Data Script
 * This script populates the database with sample products, categories, and add-ons
 * for development and testing purposes.
 * 
 * Usage: node src/scripts/seedData.js
 * 
 * WARNING: This is sample data for demonstration only.
 * Replace with real product information before launching.
 */

import { db } from '../config/firebase.js'

const categories = [
  {
    name: 'Classic Oats',
    slug: 'classic-oats',
    description: 'Traditional oatmeal combinations',
    displayOrder: 1,
    isActive: true,
  },
  {
    name: 'Fruit Oats',
    slug: 'fruit-oats',
    description: 'Oats with fresh fruits',
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'Nutty Oats',
    slug: 'nutty-oats',
    description: 'Protein-packed oats with nuts',
    displayOrder: 3,
    isActive: true,
  },
  {
    name: 'Overnight Oats',
    slug: 'overnight-oats',
    description: 'Pre-soaked cold oats',
    displayOrder: 4,
    isActive: true,
  },
]

const addOns = [
  {
    name: 'Almonds',
    description: 'Sliced almonds',
    additionalPrice: 20,
    allergens: 'Tree nuts',
    isAvailable: true,
  },
  {
    name: 'Walnuts',
    description: 'Chopped walnuts',
    additionalPrice: 25,
    allergens: 'Tree nuts',
    isAvailable: true,
  },
  {
    name: 'Chia Seeds',
    description: 'Organic chia seeds',
    additionalPrice: 15,
    allergens: '',
    isAvailable: true,
  },
  {
    name: 'Peanut Butter',
    description: 'Creamy peanut butter',
    additionalPrice: 30,
    allergens: 'Peanuts',
    isAvailable: true,
  },
  {
    name: 'Honey',
    description: 'Natural honey',
    additionalPrice: 10,
    allergens: '',
    isAvailable: true,
  },
  {
    name: 'Dates',
    description: 'Chopped dates',
    additionalPrice: 20,
    allergens: '',
    isAvailable: true,
  },
]

const sampleProducts = [
  {
    name: 'Banana Oats',
    slug: 'banana-oats',
    shortDescription: 'Classic oats with fresh bananas',
    description: 'A delicious combination of creamy oats topped with fresh banana slices. Perfect for a quick, nutritious breakfast.',
    basePrice: 89,
    servingSize: '250g',
    ingredients: 'Rolled oats, banana, milk, honey',
    allergens: 'Contains dairy',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Chocolate Oats',
    slug: 'chocolate-oats',
    shortDescription: 'Rich chocolate oatmeal treat',
    description: 'Indulgent chocolate oatmeal made with cocoa and topped with chocolate chips. A healthy dessert-style breakfast.',
    basePrice: 99,
    servingSize: '250g',
    ingredients: 'Rolled oats, cocoa powder, dark chocolate chips, milk',
    allergens: 'Contains dairy',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Peanut Butter Banana Oats',
    slug: 'peanut-butter-banana-oats',
    shortDescription: 'Protein-packed oats with PB and banana',
    description: 'Power-packed breakfast with creamy peanut butter, fresh bananas, and hearty oats. High in protein and energy.',
    basePrice: 119,
    servingSize: '300g',
    ingredients: 'Rolled oats, peanut butter, banana, honey',
    allergens: 'Contains peanuts',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Dry Fruit Oats',
    slug: 'dry-fruit-oats',
    shortDescription: 'Oats loaded with mixed dry fruits',
    description: 'A nutritious blend of oats with almonds, walnuts, raisins, and dates. Perfect for sustained energy throughout the day.',
    basePrice: 129,
    servingSize: '300g',
    ingredients: 'Rolled oats, almonds, walnuts, dates, raisins, milk',
    allergens: 'Contains tree nuts, dairy',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Berry Overnight Oats',
    slug: 'berry-overnight-oats',
    shortDescription: 'Cold-soaked oats with mixed berries',
    description: 'Refreshing overnight oats with strawberries, blueberries, and a touch of honey. Pre-made and ready to eat.',
    basePrice: 139,
    servingSize: '300g',
    ingredients: 'Rolled oats, strawberries, blueberries, yogurt, honey, chia seeds',
    allergens: 'Contains dairy',
    isFeatured: true,
    isAvailable: true,
  },
]

const siteSettings = {
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

async function seedData() {
  if (!db) {
    console.error('❌ Database not configured. Cannot seed data.')
    console.error('Please configure Firebase before running this script.')
    return
  }

  try {
    console.log('🌱 Starting to seed database...')

    // Seed categories
    console.log('\n📁 Creating categories...')
    const categoryIds = []
    for (const category of categories) {
      const docRef = await db.collection('categories').add({
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      categoryIds.push(docRef.id)
      console.log(`  ✓ Created: ${category.name} (${docRef.id})`)
    }

    // Seed add-ons
    console.log('\n➕ Creating add-ons...')
    const addOnIds = []
    for (const addOn of addOns) {
      const docRef = await db.collection('addons').add({
        ...addOn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      addOnIds.push(docRef.id)
      console.log(`  ✓ Created: ${addOn.name} (${docRef.id})`)
    }

    // Seed products
    console.log('\n🥣 Creating sample products...')
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i]
      const docRef = await db.collection('products').add({
        ...product,
        categoryId: categoryIds[i % categoryIds.length], // Distribute across categories
        addOnIds: addOnIds.slice(0, 3), // Add first 3 add-ons to each product
        imageUrl: '', // Placeholder for image
        additionalImages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`  ✓ Created: ${product.name} (${docRef.id})`)
    }

    // Seed site settings
    console.log('\n⚙️  Creating site settings...')
    await db.collection('siteSettings').doc('main').set({
      ...siteSettings,
      updatedAt: new Date().toISOString(),
    })
    console.log('  ✓ Site settings created')

    console.log('\n✨ Seed data created successfully!')
    console.log('\n📝 Next steps:')
    console.log('  1. Go to the admin dashboard (/admin)')
    console.log('  2. Upload images for each product')
    console.log('  3. Update business contact information in Settings')
    console.log('  4. Customize product descriptions and pricing')
    console.log('\n⚠️  Remember: This is sample data for demonstration only.')
    console.log('   Replace with real product information before launching.\n')

  } catch (error) {
    console.error('\n❌ Error seeding data:', error)
    console.error('Make sure Firebase is properly configured.')
  }
}

// Run the seed script
seedData()
