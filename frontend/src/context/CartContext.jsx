import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  // Load cart from localStorage on init
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('oxyCart')
    return saved ? JSON.parse(saved) : []
  })

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('oxyCart', JSON.stringify(cartItems))
  }, [cartItems])

  // Add item to cart
  const addToCart = (course) => {
    setCartItems(prev => {
      // Check if already in cart
      if (prev.some(item => item.id === course.id)) {
        return prev
      }
      return [...prev, course]
    })
  }

  // Remove item from cart
  const removeFromCart = (courseId) => {
    setCartItems(prev => prev.filter(item => item.id !== courseId))
  }

  // Check if item is in cart
  const isInCart = (courseId) => {
    return cartItems.some(item => item.id === courseId)
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
  }

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + parseFloat(item.price || 0), 0)
  }

  // Get cart count
  const getCartCount = () => {
    return cartItems.length
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    isInCart,
    clearCart,
    getCartTotal,
    getCartCount
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext

