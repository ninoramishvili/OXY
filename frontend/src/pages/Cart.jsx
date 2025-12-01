import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { purchaseCourse } from '../api'

function Cart({ user }) {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, clearCart, getCartTotal } = useCart()
  const [message, setMessage] = useState({ text: '', type: '' })
  const [processing, setProcessing] = useState(false)

  const handleRemoveItem = (courseId) => {
    removeFromCart(courseId)
    setMessage({ text: '🗑️ Item removed from cart', type: 'success' })
    setTimeout(() => setMessage({ text: '', type: '' }), 2000)
  }

  const handleCheckout = async () => {
    if (!user) {
      setMessage({ text: 'Please login to checkout', type: 'error' })
      setTimeout(() => navigate('/login'), 1500)
      return
    }

    if (cartItems.length === 0) {
      setMessage({ text: 'Your cart is empty', type: 'error' })
      return
    }

    setProcessing(true)
    setMessage({ text: 'Processing your order...', type: 'success' })

    try {
      // Purchase each course in cart
      let successCount = 0
      let failCount = 0

      for (const item of cartItems) {
        const result = await purchaseCourse(item.id, user.id)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        clearCart()
        setMessage({ 
          text: `🎉 Successfully purchased ${successCount} course${successCount > 1 ? 's' : ''}!`, 
          type: 'success' 
        })
        
        // Redirect to profile after purchase
        setTimeout(() => navigate('/profile'), 2000)
      } else {
        setMessage({ text: 'Purchase failed. Please try again.', type: 'error' })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setMessage({ text: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setProcessing(false)
    }
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
                disabled={processing || !user}
              >
                {processing ? 'Processing...' : `Complete Purchase - $${getCartTotal()}`}
              </button>
              
              <p className="demo-note">🎓 Demo mode: No actual payment required</p>

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

