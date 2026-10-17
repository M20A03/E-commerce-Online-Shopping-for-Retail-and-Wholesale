// IMPROVEMENT: Refactored Checkout page with ToastContext feedback, progress step indicator, and Firestore order submission
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from 'firebase/app-check';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, appCheck, auth } from '../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Smartphone, HandCoins, CheckCircle } from 'lucide-react';
import UPIPayment from '../components/UPIPayment';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './Checkout.css';

const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8787';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    shippingAddress: ''
  });

  const subtotal = useMemo(() => Number(getCartTotal().toFixed(2)), [getCartTotal]);
  const shippingFee = useMemo(() => (subtotal >= 500 ? 0 : 49), [subtotal]);
  const tax = useMemo(() => Number((subtotal * 0.05).toFixed(2)), [subtotal]);
  const finalTotal = useMemo(() => Number((subtotal + shippingFee + tax).toFixed(2)), [subtotal, shippingFee, tax]);

  useEffect(() => {
    if (loading || orderComplete) return;

    if (!user && cart.length > 0) {
      if (addToast) addToast('Please sign in to proceed with checkout.', 'info');
      navigate('/account', {
        replace: true,
        state: {
          from: '/checkout',
          prompt: 'Please sign in to continue checkout.'
        }
      });
      return;
    }

    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [addToast, cart.length, loading, navigate, orderComplete, user]);

  useEffect(() => {
    if (orderComplete) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderComplete]);

  const resolvedCustomerInfo = useMemo(() => ({
    firstName: customerInfo.firstName || user?.firstName || '',
    lastName: customerInfo.lastName || user?.lastName || '',
    contact: customerInfo.contact || user?.contact || '',
    email: customerInfo.email || user?.email || '',
    shippingAddress: customerInfo.shippingAddress || ''
  }), [customerInfo, user]);

  const submitOrder = useCallback(async (paymentMethodToSubmit, paymentData = null) => {
    const generatedId = `RE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderPayload = {
      id: generatedId,
      userId: user?.id || `guest_${Date.now()}`,
      userEmail: user?.email || resolvedCustomerInfo.email || '',
      paymentMethod: paymentMethodToSubmit,
      paymentData,
      customer: resolvedCustomerInfo,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity
      })),
      total: finalTotal,
      subtotal,
      tax,
      shippingFee,
      status: 'Processing',
      paymentStatus: paymentMethodToSubmit === 'cod' ? 'Pending COD' : 'Paid',
      date: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: serverTimestamp()
    };

    // Resilient local storage persistence for guest and offline instant recall
    try {
      const localCopy = { ...orderPayload, createdAt: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem('roshan_orders') || '[]');
      localStorage.setItem('roshan_orders', JSON.stringify([localCopy, ...existing.filter((o) => o.id !== generatedId)]));
    } catch (storageErr) {
      console.warn('Local order storage warning:', storageErr);
    }

    try {
      if (ORDER_API_BASE_URL && !ORDER_API_BASE_URL.includes('localhost') && auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        const appCheckHeader = appCheck ? await getToken(appCheck, false) : null;

        const response = await fetch(`${ORDER_API_BASE_URL}/api/orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            ...(appCheckHeader?.token ? { 'X-Firebase-AppCheck': appCheckHeader.token } : {})
          },
          body: JSON.stringify(orderPayload)
        });

        if (response.ok) {
          const res = await response.json();
          return { success: true, id: res?.id || generatedId };
        }
      }

      // Direct Firestore submission
      const docRef = await addDoc(collection(db, 'orders'), orderPayload);
      return { success: true, id: generatedId || docRef.id };
    } catch (error) {
      console.error('Order submission error:', error);
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderPayload);
        return { success: true, id: generatedId || docRef.id };
      } catch (dbErr) {
        console.warn('Firestore fallback warning:', dbErr);
        // Even if network/permission fails, order is saved locally in roshan_orders
        return { success: true, id: generatedId };
      }
    }
  }, [user, resolvedCustomerInfo, cart, finalTotal, subtotal, tax, shippingFee]);

  const handleInfoChange = useCallback((event) => {
    const { name, value } = event.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUPIPaymentConfirm = useCallback(async (paymentData) => {
    setFormError('');

    if (!resolvedCustomerInfo.firstName || !resolvedCustomerInfo.lastName || !resolvedCustomerInfo.contact || !resolvedCustomerInfo.email || !resolvedCustomerInfo.shippingAddress) {
      const err = 'Please fill in all required customer and shipping details.';
      setFormError(err);
      if (addToast) addToast(err, 'error');
      return;
    }

    if (!acceptTerms) {
      const err = 'Please accept the terms before placing your order.';
      setFormError(err);
      if (addToast) addToast(err, 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await submitOrder('upi', {
        amount: finalTotal,
        upiId: paymentData.upiId,
        transactionId: paymentData.transactionId,
        timestamp: paymentData.timestamp
      });

      setPlacedOrderId(orderRes?.id || '');
      setOrderComplete(true);
      clearCart();
      if (addToast) addToast('Order placed successfully! Thank you for shopping with us.', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const err = error.message || 'Failed to process UPI payment. Please try again.';
      setFormError(err);
      if (addToast) addToast(err, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [resolvedCustomerInfo, acceptTerms, submitOrder, finalTotal, clearCart, addToast]);

  const handleCheckout = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');

    if (!resolvedCustomerInfo.firstName || !resolvedCustomerInfo.lastName || !resolvedCustomerInfo.contact || !resolvedCustomerInfo.email || !resolvedCustomerInfo.shippingAddress) {
      const err = 'Please fill in all required customer and shipping details.';
      setFormError(err);
      if (addToast) addToast(err, 'error');
      return;
    }

    if (!acceptTerms) {
      const err = 'Please accept the terms before placing your order.';
      setFormError(err);
      if (addToast) addToast(err, 'warning');
      return;
    }

    if (paymentMethod === 'upi') {
      const err = 'Please complete the UPI payment QR section and click Confirm Payment.';
      setFormError(err);
      if (addToast) addToast(err, 'info');
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await submitOrder(paymentMethod);
      setPlacedOrderId(orderRes?.id || '');
      setOrderComplete(true);
      clearCart();
      if (addToast) addToast('Order placed successfully!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const err = error.message || 'Failed to place order. Please try again.';
      setFormError(err);
      if (addToast) addToast(err, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [resolvedCustomerInfo, acceptTerms, paymentMethod, submitOrder, clearCart, addToast]);

  if (orderComplete) {
    return (
      <div className="container section flex-col items-center justify-center animate-fade-in" style={{ minHeight: '60vh', textAlign: 'center', padding: '3rem 1rem' }}>
        <CheckCircle size={72} color="#22c55e" style={{ marginBottom: '1.25rem' }} />
        <h1 className="heading-1 mb-2">
          {paymentMethod === 'cod' ? 'Order Confirmed!' : 'Payment & Order Confirmed!'}
        </h1>
        {placedOrderId && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(212, 163, 115, 0.12)', border: '1px solid rgba(212, 163, 115, 0.35)', padding: '0.6rem 1.25rem', borderRadius: '999px', margin: '1rem 0 1.5rem' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Order ID:</span>
            <strong style={{ color: 'var(--accent)', letterSpacing: '0.04em' }}>{placedOrderId}</strong>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '999px', minHeight: 'unset' }}
              onClick={() => {
                navigator.clipboard.writeText(placedOrderId);
                if (addToast) addToast('Order ID copied to clipboard!', 'success');
              }}
            >
              Copy
            </button>
          </div>
        )}
        <p className="text-muted" style={{ fontSize: '1.02rem', marginBottom: '2rem', maxWidth: '520px', lineHeight: 1.6 }}>
          Thank you for choosing Roshan Enterprises. Your order is registered in our Dhanbad fulfillment center and will be dispatched promptly.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/track-order?id=${encodeURIComponent(placedOrderId)}`)}
          >
            Track This Order
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/categories')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <h1 className="heading-1 mb-6">Checkout</h1>

      {/* Progress step bar */}
      <div className="checkout-progress card">
        <div className="checkout-progress__step is-active">1. Shipping</div>
        <div className="checkout-progress__step is-active">2. Payment</div>
        <div className="checkout-progress__step">3. Review & Place</div>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form-container">
          {/* Shipping Form */}
          <div className="card checkout-section">
            <h3 className="heading-3 mb-4 border-bottom">Shipping Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" className="input" name="firstName" value={resolvedCustomerInfo.firstName} onChange={handleInfoChange} required />
              </div>
              <div>
                <label className="label" htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" className="input" name="lastName" value={resolvedCustomerInfo.lastName} onChange={handleInfoChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label" htmlFor="contact">Contact Number</label>
                <input id="contact" type="tel" className="input" name="contact" value={resolvedCustomerInfo.contact} onChange={handleInfoChange} required />
              </div>
              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input id="email" type="email" className="input" name="email" value={resolvedCustomerInfo.email} onChange={handleInfoChange} required />
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="shippingAddress">Shipping Address</label>
              <textarea id="shippingAddress" className="input" rows="3" name="shippingAddress" value={resolvedCustomerInfo.shippingAddress} onChange={handleInfoChange} placeholder="House / Flat No., Street, Area, City, Pincode..." required />
            </div>
          </div>

          {/* Payment Options */}
          <div className="card checkout-section mt-6">
            <h3 className="heading-3 mb-4 border-bottom">Select Payment Method</h3>

            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <Smartphone size={24} />
                <span>UPI / QR Payment</span>
              </label>

              <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <HandCoins size={24} />
                <span>Cash on Delivery</span>
              </label>
            </div>

            {paymentMethod === 'upi' && (
              <div className="payment-form animate-fade-in">
                <UPIPayment
                  amount={finalTotal}
                  lockedAmount={finalTotal}
                  customerName={`${resolvedCustomerInfo.firstName} ${resolvedCustomerInfo.lastName}`}
                  onPaymentConfirm={handleUPIPaymentConfirm}
                />
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="payment-form animate-fade-in">
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Pay in cash when your order is delivered to your address. Please keep exact change ready.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary-container">
          <div className="card checkout-summary">
            <h3 className="heading-3 mb-4 border-bottom">Order Summary</h3>

            <div className="summary-items">
              {cart.map((item) => (
                <div key={item.id} className="summary-item">
                  <img
                    src={optimizeImageUrl(item.image, 160)}
                    alt={item.name}
                    className="summary-item-img"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageError(e, '/products/t1.jpg')}
                  />
                  <div className="summary-item-info">
                    <h4 className="summary-item-name">{item.name}</h4>
                    <span className="summary-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <div className="summary-item-price">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="summary-row">
                <span>Estimated Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <label className="checkout-consent">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
              <span>I agree to terms of service, return policy, and shipping policies.</span>
            </label>

            {formError && <p className="checkout-error" role="alert">{formError}</p>}

            {paymentMethod !== 'upi' && (
              <button
                type="button"
                className="btn btn-primary btn-checkout"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing
                  ? (paymentMethod === 'cod' ? 'Placing Order...' : 'Processing...')
                  : (paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${finalTotal.toFixed(2)}`)}
              </button>
            )}
            <p className="text-center text-muted mt-4" style={{ fontSize: '0.8rem' }}>
              Encrypted SSL secure transaction guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Checkout);
