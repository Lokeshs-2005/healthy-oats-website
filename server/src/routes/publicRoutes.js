import express from 'express'
import { productService } from '../services/productService.js'
import { categoryService } from '../services/categoryService.js'
import { addonService } from '../services/addonService.js'
import { settingsService } from '../services/settingsService.js'
import { orderService } from '../services/orderService.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

router.get('/products', async (req, res, next) => {
  try {
    const products = await productService.getAll(req.query)
    res.json(products)
  } catch (error) {
    next(error)
  }
})

router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await productService.getBySlug(req.params.slug)
    res.json(product)
  } catch (error) {
    next(error)
  }
})

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await categoryService.getAll()
    res.json(categories)
  } catch (error) {
    next(error)
  }
})

router.get('/addons', async (req, res, next) => {
  try {
    const addons = await addonService.getAll()
    res.json(addons)
  } catch (error) {
    next(error)
  }
})

router.get('/site-settings', async (req, res, next) => {
  try {
    const settings = await settingsService.get()
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

router.post('/orders', rateLimit({ windowMs: 15 * 60 * 1000, max: 8, keyPrefix: 'orders' }), async (req, res, next) => {
  try {
    const order = await orderService.create(req.body)
    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
})

router.get('/orders/:orderNumber', async (req, res, next) => {
  try {
    const email = req.query.email
    if (!email) {
      throw new AppError('Email is required to look up an order', 400)
    }
    const order = await orderService.getByOrderNumber(req.params.orderNumber, email)
    res.json(order)
  } catch (error) {
    next(error)
  }
})

export default router
