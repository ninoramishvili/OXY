import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Cart({ user }) {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, clearCart, getCartTotal } = useCart()
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleRemoveItem = (courseId) => {
    removeFromCart(courseId)
    setMessage({ text: '🗑️ Item removed from cart', type: 'success' })
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
  }

  const handleCheckout = () => {
    if (!user?.id) {
      setMessage({ text: 'Please login to checkout', type: 'error' })
      setTimeout(() => navigate('/login'), 1500)
      return
    }

    if (cartItems.length === 0) {
      setMessage({ text: 'Your cart is empty', type: 'error' })
      return
    }

    // Navigate to checkout page
    navigate('/checkout')
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>🛒 Shopping Cart</h1>
        <p>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      {message.text && (
        <div className={`cart-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="cart-content">
        {cartItems.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image" style={{ background: item.color }}>
                    {item.image}
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.title}</h3>
                    <p className="cart-item-category">{item.category}</p>
                    <p className="cart-item-duration">⏱️ {item.duration}</p>
                  </div>
                  <div className="cart-item-price">
                    ${item.price}
                  </div>
                  <button 
                    className="cart-item-remove"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${getCartTotal()}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span className="discount">-$0</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${getCartTotal()}</span>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-large btn-checkout"
                onClick={handleCheckout}
                disabled={!user || cartItems.length === 0}
              >
                Proceed to Checkout - ${getCartTotal()}
              </button>

              {!user && (
                <p className="checkout-note">
                  <Link to="/login">Login</Link> or <Link to="/register">Register</Link> to checkout
                </p>
              )}

              <button 
                className="btn-clear-cart"
                onClick={() => {
                  clearCart()
                  setMessage({ text: 'Cart cleared', type: 'success' })
                  setTimeout(() => setMessage({ text: '', type: '' }), 2000)
                }}
              >
                Clear Cart
              </button>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <span className="empty-cart-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any courses yet.</p>
            <Link to="/courses" className="btn btn-primary btn-large">
              Browse Courses
            </Link>
          </div>
        )}
      </div>

      {/* Continue Shopping */}
      {cartItems.length > 0 && (
        <div className="continue-shopping">
          <Link to="/courses" className="btn btn-secondary">
            ← Continue Shopping
          </Link>
        </div>
      )}
    </div>
  )
}

export default Cart

