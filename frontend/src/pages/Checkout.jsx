import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { purchaseCourse } from '../api'

function Checkout({ user }) {
  const navigate = useNavigate()
  const { cartItems, getCartTotal, clearCart } = useCart()
  const [step, setStep] = useState(1) // 1: Review, 2: Payment, 3: Confirmation
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [initialized, setInitialized] = useState(false)
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    // Give cart context time to load from localStorage
    const timer = setTimeout(() => {
      setInitialized(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!initialized) return
    
    if (!user) {
      navigate('/login')
      return
    }
    if (cartItems.length === 0 && step !== 3) {
      navigate('/cart')
    }
  }, [user, cartItems, navigate, step, initialized])

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value)
    } else if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4)
    }

    setPaymentForm(prev => ({ ...prev, [name]: formattedValue }))
    setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = 'Please enter a valid card number'
    }
    if (!paymentForm.cardName.trim()) {
      errors.cardName = 'Please enter the name on card'
    }
    if (!paymentForm.expiry || paymentForm.expiry.length < 5) {
      errors.expiry = 'Please enter a valid expiry date'
    }
    if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProceedToPayment = () => {
    setStep(2)
  }

  const handlePayment = async () => {
    if (!validateForm()) return

    setProcessing(true)
    setError('')

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Process purchases for each cart item
      let successCount = 0
      for (const item of cartItems) {
        const result = await purchaseCourse(item.id, user.id)
        if (result.success) {
          successCount++
        }
      }

      if (successCount > 0) {
        // Generate order number
        const orderNum = 'ORD-' + Date.now().toString(36).toUpperCase()
        setOrderNumber(orderNum)
        clearCart()
        setStep(3)
      } else {
        setError('Some items could not be purchased. They may already be in your library.')
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const getCardType = (number) => {
    const num = number.replace(/\s/g, '')
    if (/^4/.test(num)) return 'visa'
    if (/^5[1-5]/.test(num)) return 'mastercard'
    if (/^3[47]/.test(num)) return 'amex'
    return 'card'
  }

  const cardIcons = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    card: '💳'
  }

  if (!user || !initialized) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      {/* Progress Steps */}
      <div className="checkout-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span className="step-number">{step > 1 ? '✓' : '1'}</span>
          <span className="step-label">Review</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span className="step-number">{step > 2 ? '✓' : '2'}</span>
          <span className="step-label">Payment</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">{step >= 3 ? '✓' : '3'}</span>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      {/* Step 1: Order Review */}
      {step === 1 && (
        <div className="checkout-content">
          <div className="checkout-main">
            <h1>Review Your Order</h1>
            
            <div className="order-items">
              {cartItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="order-item-image" style={{ background: item.color }}>
                    {item.image}
                  </div>
                  <div className="order-item-details">
                    <h3>{item.title}</h3>
                    <p>{item.category}</p>
                  </div>
                  <div className="order-item-price">
                    ${item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              
              <button 
                className="btn btn-primary btn-large btn-full"
                onClick={handleProceedToPayment}
              >
                Proceed to Payment
              </button>

              <p className="demo-notice">
                🎓 <strong>Demo Mode:</strong> No real payment will be processed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="checkout-content">
          <div className="checkout-main">
            <h1>Payment Details</h1>
            
            <div className="payment-form-container">
              <div className="demo-banner">
                <span className="demo-icon">🔒</span>
                <div>
                  <strong>Demo Mode - Secure Checkout</strong>
                  <p>Enter any test card details. No real payment will be processed.</p>
                </div>
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <div className="card-input-wrapper">
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={formErrors.cardNumber ? 'error' : ''}
                    />
                    <span className="card-icon">{cardIcons[getCardType(paymentForm.cardNumber)]}</span>
                  </div>
                  {formErrors.cardNumber && <span className="error-text">{formErrors.cardNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Name on Card</label>
                  <input
                    type="text"
                    name="cardName"
                    value={paymentForm.cardName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={formErrors.cardName ? 'error' : ''}
                  />
                  {formErrors.cardName && <span className="error-text">{formErrors.cardName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiry"
                      value={paymentForm.expiry}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={formErrors.expiry ? 'error' : ''}
                    />
                    {formErrors.expiry && <span className="error-text">{formErrors.expiry}</span>}
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentForm.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength={4}
                      className={formErrors.cvv ? 'error' : ''}
                    />
                    {formErrors.cvv && <span className="error-text">{formErrors.cvv}</span>}
                  </div>
                </div>

                {error && (
                  <div className="payment-error">
                    ⚠️ {error}
                  </div>
                )}

                <div className="payment-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    disabled={processing}
                  >
                    Back
                  </button>
                  <button 
                    className="btn btn-primary btn-large"
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      `Pay $${getCartTotal().toFixed(2)}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary-card compact">
              <h3>Order Summary</h3>
              <div className="compact-items">
                {cartItems.map(item => (
                  <div key={item.id} className="compact-item">
                    <span>{item.title}</span>
                    <span>${item.price}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="security-badges">
              <div className="badge">🔒 SSL Encrypted</div>
              <div className="badge">✓ Secure Payment</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="checkout-confirmation">
          <div className="confirmation-card">
            <div className="confirmation-icon">🎉</div>
            <h1>Payment Successful!</h1>
            <p className="order-number">Order #{orderNumber}</p>
            
            <div className="confirmation-message">
              <p>Thank you for your purchase! Your courses are now available in your profile.</p>
              <p className="email-note">A confirmation email has been sent to <strong>{user.email}</strong></p>
            </div>

            <div className="confirmation-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => navigate('/profile')}
              >
                Go to My Courses
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/courses')}
              >
                Browse More Courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout

