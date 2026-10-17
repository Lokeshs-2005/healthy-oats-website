import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_ITEM_QUANTITY } from '../config/constants'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const getItemUnitPrice = (item) => {
  return Number(item.basePrice) || 0
}

export const getCartItemId = (productId) => {
  return String(productId)
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('healthyOatsCart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('Error loading cart:', error)
      return []
    }
  })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem('healthyOatsCart', JSON.stringify(cart))
  }, [cart])

  const showToast = useCallback((message) => {
    setToast(message)
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const addToCart = useCallback((product, quantity = 1, selectedAddOns = []) => {
    const cartItemId = getCartItemId(product.id)
    const safeQuantity = Math.min(Math.max(Number(quantity) || 1, 1), MAX_ITEM_QUANTITY)

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => (item.cartItemId || item.id) === cartItemId)

      if (existingItem) {
        return prevCart.map((item) =>
          (item.cartItemId || item.id) === cartItemId
            ? { ...item, quantity: Math.min(item.quantity + safeQuantity, MAX_ITEM_QUANTITY) }
            : item
        )
      }

      return [
        ...prevCart,
        {
          cartItemId,
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
          shortDescription: product.shortDescription,
          basePrice: product.basePrice,
          quantity: safeQuantity,
        },
      ]
    })

    showToast(`${product.name} added to cart`)
  }, [showToast])

  const removeFromCart = useCallback((itemId) => {
    setCart((prevCart) => prevCart.filter((item) => (item.cartItemId || item.id) !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) {
      setCart((prevCart) => prevCart.filter((item) => (item.cartItemId || item.id) !== itemId))
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        (item.cartItemId || item.id) === itemId
          ? { ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }
          : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart((prevCart) => (prevCart.length === 0 ? prevCart : []))
    localStorage.removeItem('healthyOatsCart')
  }, [])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + getItemUnitPrice(item) * item.quantity, 0)
  }, [cart])

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  const getItemCount = useCallback(() => cart.length, [cart])

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      getItemCount,
      toast,
      showToast,
    }),
    [
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      getItemCount,
      toast,
      showToast,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
