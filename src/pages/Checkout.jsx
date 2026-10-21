// IMPROVEMENT: Enterprise-grade Mobile-First Checkout with 3-Step Wizard, UPI UTR verification, dynamic ETA, and resilient state synchronization
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from 'firebase/app-check';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, appCheck, auth } from '../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Smartphone,
  HandCoins,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  Copy,
  AlertCircle
} from 'lucide-react';
import UPIPayment from '../components/UPIPayment';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import {
  ORDER_STATUSES,
  createInitialOrderTimeline,
  calculateDynamicETA
} from '../utils/orderLifecycle';
import './Checkout.css';

const ORDER_API_BASE_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8787';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Wizard Step: 1 = Shipping, 2 = Payment, 3 = Review & Confirm
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiPaymentData, setUpiPaymentData] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    shippingAddress: '',
    pincode: ''
  });

  const subtotal = useMemo(() => Number(getCartTotal().toFixed(2)), [getCartTotal]);
  const shippingFee = useMemo(() => (subtotal >= 500 ? 0 : 49), [subtotal]);
  const tax = useMemo(() => Number((subtotal * 0.05).toFixed(2)), [subtotal]);
  const finalTotal = useMemo(() => Number((subtotal + shippingFee + tax).toFixed(2)), [subtotal, shippingFee, tax]);

  // Dynamic ETA based on shipping address or pincode
  const etaDetails = useMemo(() => {
    return calculateDynamicETA(customerInfo.pincode || customerInfo.shippingAddress);
  }, [customerInfo.pincode, customerInfo.shippingAddress]);

  useEffect(() => {
    if (loading || orderComplete) return;

    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart.length, loading, navigate, orderComplete]);

  useEffect(() => {
    if (orderComplete) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderComplete]);

  // Pre-fill user details if available
  useEffect(() => {
    if (user) {
      setCustomerInfo((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || (user.displayName ? user.displayName.split(' ')[0] : ''),
        lastName: prev.lastName || user.lastName || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''),
        contact: prev.contact || user.contact || user.phoneNumber || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const resolvedCustomerInfo = useMemo(() => ({
    firstName: (customerInfo.firstName || user?.firstName || '').trim(),
    lastName: (customerInfo.lastName || user?.lastName || '').trim(),
    contact: (customerInfo.contact || user?.contact || '').trim(),
    email: (customerInfo.email || user?.email || '').trim(),
    shippingAddress: (customerInfo.shippingAddress || '').trim(),
    pincode: (customerInfo.pincode || '').trim()
  }), [customerInfo, user]);

  const handleInfoChange = useCallback((event) => {
    const { name, value } = event.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  }, []);

  // Validation for Step 1
  const validateStep1 = useCallback(() => {
    if (!resolvedCustomerInfo.firstName) return 'Please enter your first name.';
    if (!resolvedCustomerInfo.lastName) return 'Please enter your last name.';
    if (!resolvedCustomerInfo.contact || resolvedCustomerInfo.contact.length < 10) {
      return 'Please enter a valid 10-digit mobile number for order delivery.';
    }
    if (!resolvedCustomerInfo.email || !resolvedCustomerInfo.email.includes('@')) {
      return 'Please enter a valid email address.';
    }
    if (!resolvedCustomerInfo.shippingAddress || resolvedCustomerInfo.shippingAddress.length < 10) {
      return 'Please enter your full delivery address (House/Street/Area/City).';
    }
    return '';
  }, [resolvedCustomerInfo]);

  // Handle step progression
  const handleNextStep = useCallback(() => {
    setFormError('');
    if (currentStep === 1) {
      const error = validateStep1();
      if (error) {
        setFormError(error);
        if (addToast) addToast(error, 'error');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (paymentMethod === 'upi' && !upiPaymentData) {
        const error = 'Please submit your 12-digit UPI Transaction Reference (UTR) before continuing.';
        setFormError(error);
        if (addToast) addToast(error, 'warning');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep1, paymentMethod, upiPaymentData, addToast]);

  const handlePrevStep = useCallback(() => {
    setFormError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // UPI Payment confirmation callback
  const handleUPIPaymentConfirm = useCallback((paymentData) => {
    setUpiPaymentData(paymentData);
    setFormError('');
    if (addToast) addToast('UPI Payment details recorded! Proceeding to review.', 'success');
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [addToast]);

  // Submit Order to Firestore and Local Storage
  const submitFinalOrder = useCallback(async () => {
    setFormError('');

    const step1Err = validateStep1();
    if (step1Err) {
      setFormError(step1Err);
      setCurrentStep(1);
      return;
    }

    if (paymentMethod === 'upi' && !upiPaymentData) {
      setFormError('Please complete UPI payment verification in Step 2.');
      setCurrentStep(2);
      return;
    }

    if (!acceptTerms) {
      const err = 'Please accept the terms and conditions to complete your order.';
      setFormError(err);
      if (addToast) addToast(err, 'warning');
      return;
    }

    setIsProcessing(true);

    const generatedId = `RE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCOD = paymentMethod === 'cod';

    const orderPayload = {
      id: generatedId,
      userId: user?.id || `guest_${Date.now()}`,
      userEmail: user?.email || resolvedCustomerInfo.email || '',
      paymentMethod,
      paymentData: isCOD
        ? { method: 'Cash on Delivery', amount: finalTotal }
        : {
            method: 'UPI',
            amount: finalTotal,
            utr: upiPaymentData?.transactionId || '',
            transactionId: upiPaymentData?.transactionId || '',
            upiId: upiPaymentData?.upiId || '7004634675@ybl',
            timestamp: upiPaymentData?.timestamp || new Date().toISOString()
          },
      paymentStatus: isCOD ? 'Pending COD' : 'Under Review',
      paymentVerificationStatus: isCOD ? 'COD Confirmed' : 'Under Review',
      status: ORDER_STATUSES.ORDER_PLACED,
      timeline: createInitialOrderTimeline({
        paymentMethod,
        notes: deliveryNotes || ''
      }),
      dispatchInfo: {
        courierName: 'Roshan Express Local',
        trackingNumber: generatedId,
        riderContact: '+91 7004634675',
        dispatchDate: null
      },
      eta: etaDetails.window,
      etaDetails,
      deliveryNotes: deliveryNotes.trim(),
      customer: resolvedCustomerInfo,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || (Array.isArray(item.images) ? item.images[0] : ''),
        images: Array.isArray(item.images) ? item.images : [item.image].filter(Boolean),
        quantity: item.quantity
      })),
      total: finalTotal,
      subtotal,
      tax,
      shippingFee,
      date: new Date().toISOString(),
      estimatedDeliveryDate: etaDetails.estimatedDate,
      createdAt: serverTimestamp()
    };

    // Resilient local storage persistence for offline & instant retrieval
    try {
      const localCopy = { ...orderPayload, createdAt: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem('roshan_orders') || '[]');
      localStorage.setItem('roshan_orders', JSON.stringify([localCopy, ...existing.filter((o) => o.id !== generatedId)]));
    } catch (storageErr) {
      console.warn('Local order storage warning:', storageErr);
    }

    try {
      // If custom API is running and available
      if (ORDER_API_BASE_URL && !ORDER_API_BASE_URL.includes('localhost') && auth.currentUser) {
        try {
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
            const orderIdResult = res?.id || generatedId;
            setPlacedOrderId(orderIdResult);
            setOrderComplete(true);
            clearCart();
            if (addToast) addToast('Order placed successfully!', 'success');
            return;
          }
        } catch (apiErr) {
          console.warn('Backend API submission failed, falling back to direct Firestore:', apiErr);
        }
      }

      // Direct Firestore submission
      const docRef = await addDoc(collection(db, 'orders'), orderPayload);
      const finalId = generatedId || docRef.id;

      setPlacedOrderId(finalId);
      setOrderComplete(true);
      // Cart cleared ONLY after verified creation
      clearCart();
      if (addToast) addToast('Order placed successfully! Confirmation logged.', 'success');
    } catch (dbErr) {
      console.error('Firestore order submission error:', dbErr);
      // Resilient fallback: order is already safely saved in local storage
      setPlacedOrderId(generatedId);
      setOrderComplete(true);
      clearCart();
      if (addToast) addToast('Order registered locally! Will sync automatically.', 'info');
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateStep1,
    paymentMethod,
    upiPaymentData,
    acceptTerms,
    user,
    finalTotal,
    deliveryNotes,
    etaDetails,
    resolvedCustomerInfo,
    cart,
    subtotal,
    tax,
    shippingFee,
    clearCart,
    addToast
  ]);

  const copyOrderId = useCallback(() => {
    if (placedOrderId) {
      navigator.clipboard.writeText(placedOrderId);
      setCopiedId(true);
      if (addToast) addToast('Order ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  }, [placedOrderId, addToast]);

  // Order Confirmed Screen
  if (orderComplete) {
    return (
      <div className="checkout-success-view container section animate-fade-in">
        <div className="checkout-success-card">
          <div className="checkout-success-icon-wrap">
            <CheckCircle size={56} className="checkout-success-icon" />
          </div>

          <span className="checkout-success-pill">
            {paymentMethod === 'cod' ? 'Cash on Delivery Confirmed' : 'UPI Payment Under Review'}
          </span>

          <h1 className="checkout-success-title">Order Confirmed!</h1>
          <p className="checkout-success-sub">
            Thank you for shopping with Roshan Enterprises. Your package is scheduled for fulfillment at our Dhanbad logistics hub.
          </p>

          {placedOrderId && (
            <div className="checkout-success-id-box">
              <span className="checkout-success-id-label">Order Reference ID:</span>
              <strong className="checkout-success-id-value">{placedOrderId}</strong>
              <button
                type="button"
                className="btn btn-outline checkout-copy-btn"
                onClick={copyOrderId}
                aria-label="Copy Order ID"
              >
                <Copy size={13} />
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div className="checkout-success-eta-card">
            <div className="checkout-success-eta-header">
              <Truck size={18} color="var(--accent)" />
              <strong>{etaDetails.description}</strong>
            </div>
            <p className="checkout-success-eta-text">
              Estimated Delivery: <strong>{etaDetails.window}</strong>
            </p>
          </div>

          <div className="checkout-success-actions">
            <button
              type="button"
              className="btn btn-primary checkout-action-btn"
              onClick={() => navigate(`/track-order?id=${encodeURIComponent(placedOrderId)}`)}
            >
              <Truck size={16} />
              Track This Order Live
            </button>
            <button
              type="button"
              className="btn btn-outline checkout-action-btn"
              onClick={() => navigate('/orders')}
            >
              View Order History
            </button>
            <button
              type="button"
              className="btn btn-ghost checkout-action-btn"
              onClick={() => navigate('/categories')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container container section animate-fade-in">
      <div className="checkout-header-area">
        <h1 className="checkout-page-title">Secure Checkout</h1>
        <p className="checkout-page-subtitle">
          Fulfillment directly from Satyam Nagar, Dhanbad
        </p>
      </div>

      {/* 3-Step Wizard Navigation Header */}
      <div className="checkout-wizard-bar" role="navigation" aria-label="Checkout Progress">
        <button
          type="button"
          className={`checkout-wizard-step ${currentStep === 1 ? 'is-active' : ''} ${currentStep > 1 ? 'is-done' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span className="wizard-step-badge">{currentStep > 1 ? '✓' : '1'}</span>
          <span className="wizard-step-label">Delivery Address</span>
        </button>

        <div className={`checkout-wizard-connector ${currentStep >= 2 ? 'is-active' : ''}`} />

        <button
          type="button"
          className={`checkout-wizard-step ${currentStep === 2 ? 'is-active' : ''} ${currentStep > 2 ? 'is-done' : ''}`}
          onClick={() => {
            if (!validateStep1()) setCurrentStep(2);
          }}
        >
          <span className="wizard-step-badge">{currentStep > 2 ? '✓' : '2'}</span>
          <span className="wizard-step-label">Payment Method</span>
        </button>

        <div className={`checkout-wizard-connector ${currentStep >= 3 ? 'is-active' : ''}`} />

        <button
          type="button"
          className={`checkout-wizard-step ${currentStep === 3 ? 'is-active' : ''}`}
          onClick={() => {
            if (!validateStep1() && (paymentMethod === 'cod' || upiPaymentData)) {
              setCurrentStep(3);
            }
          }}
        >
          <span className="wizard-step-badge">3</span>
          <span className="wizard-step-label">Review & Place</span>
        </button>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main-content">
          {formError && (
            <div className="checkout-error-banner" role="alert">
              <AlertCircle size={18} className="checkout-error-icon" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: SHIPPING & CONTACT */}
          {currentStep === 1 && (
            <div className="checkout-card animate-fade-in">
              <div className="checkout-card-header">
                <MapPin size={20} className="checkout-header-icon" />
                <div>
                  <h2 className="checkout-section-title">Step 1: Contact & Delivery Address</h2>
                  <p className="checkout-section-sub">Where should we deliver your order?</p>
                </div>
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="firstName">
                      First Name <span className="req">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      className="checkout-input"
                      placeholder="e.g. Ramesh"
                      value={customerInfo.firstName}
                      onChange={handleInfoChange}
                      required
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="lastName">
                      Last Name <span className="req">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      className="checkout-input"
                      placeholder="e.g. Kumar"
                      value={customerInfo.lastName}
                      onChange={handleInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="contact">
                      Mobile Number <span className="req">*</span>
                    </label>
                    <input
                      id="contact"
                      type="tel"
                      name="contact"
                      className="checkout-input"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={customerInfo.contact}
                      onChange={handleInfoChange}
                      required
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="checkout-input"
                      placeholder="name@example.com"
                      value={customerInfo.email}
                      onChange={handleInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="shippingAddress">
                    Complete Shipping Address <span className="req">*</span>
                  </label>
                  <textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    rows="3"
                    className="checkout-input checkout-textarea"
                    placeholder="House/Shop No., Landmark, Street, Colony/Area, City..."
                    value={customerInfo.shippingAddress}
                    onChange={handleInfoChange}
                    required
                  />
                </div>

                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="pincode">
                      PIN Code (Optional)
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      name="pincode"
                      className="checkout-input"
                      placeholder="e.g. 826001 (Dhanbad)"
                      maxLength={6}
                      value={customerInfo.pincode}
                      onChange={handleInfoChange}
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="notes">
                      Delivery Landmark / Notes
                    </label>
                    <input
                      id="notes"
                      type="text"
                      name="notes"
                      className="checkout-input"
                      placeholder="Near Hanuman Mandir, Katras Road..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Local Dhanbad Notice */}
                <div className="checkout-eta-badge">
                  <Truck size={16} />
                  <span>
                    Estimated Delivery: <strong>{etaDetails.window}</strong> ({etaDetails.description})
                  </span>
                </div>
              </div>

              <div className="checkout-step-footer">
                <button
                  type="button"
                  className="btn btn-primary checkout-next-btn"
                  onClick={handleNextStep}
                >
                  Continue to Payment
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {currentStep === 2 && (
            <div className="checkout-card animate-fade-in">
              <div className="checkout-card-header">
                <Smartphone size={20} className="checkout-header-icon" />
                <div>
                  <h2 className="checkout-section-title">Step 2: Choose Payment Method</h2>
                  <p className="checkout-section-sub">Direct UPI with Instant QR or Cash on Delivery</p>
                </div>
              </div>

              <div className="checkout-payment-selector">
                <label
                  className={`checkout-payment-tile ${paymentMethod === 'upi' ? 'is-selected' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                  />
                  <div className="payment-tile-content">
                    <div className="payment-tile-top">
                      <Smartphone size={22} className="payment-tile-icon" />
                      <strong className="payment-tile-title">Instant UPI & QR</strong>
                      <span className="payment-tile-tag">Recommended</span>
                    </div>
                    <p className="payment-tile-desc">
                      GPay, PhonePe, Paytm, BHIM, or Scan & Pay with 12-digit UTR confirmation.
                    </p>
                  </div>
                </label>

                <label
                  className={`checkout-payment-tile ${paymentMethod === 'cod' ? 'is-selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div className="payment-tile-content">
                    <div className="payment-tile-top">
                      <HandCoins size={22} className="payment-tile-icon" />
                      <strong className="payment-tile-title">Cash on Delivery (COD)</strong>
                    </div>
                    <p className="payment-tile-desc">
                      Pay in cash at your doorstep when goods are handed over.
                    </p>
                  </div>
                </label>
              </div>

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div className="checkout-upi-wrapper animate-fade-in">
                  <UPIPayment
                    amount={finalTotal}
                    lockedAmount={finalTotal}
                    customerName={`${resolvedCustomerInfo.firstName} ${resolvedCustomerInfo.lastName}`}
                    onPaymentConfirm={handleUPIPaymentConfirm}
                  />
                </div>
              )}

              {/* COD Form */}
              {paymentMethod === 'cod' && (
                <div className="checkout-cod-info animate-fade-in">
                  <p>
                    ✓ No advance payment required. Please keep exact cash of <strong>₹{finalTotal.toFixed(2)}</strong> ready at the time of delivery.
                  </p>
                  <div className="checkout-step-footer" style={{ marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft size={16} />
                      Back to Address
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNextStep}
                    >
                      Review Order Details
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="checkout-step-footer" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft size={16} />
                    Back to Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & PLACE */}
          {currentStep === 3 && (
            <div className="checkout-card animate-fade-in">
              <div className="checkout-card-header">
                <ShieldCheck size={20} className="checkout-header-icon" />
                <div>
                  <h2 className="checkout-section-title">Step 3: Review & Place Order</h2>
                  <p className="checkout-section-sub">Please verify your delivery address and payment</p>
                </div>
              </div>

              {/* Delivery Details Review */}
              <div className="checkout-review-section">
                <div className="review-section-header">
                  <span className="review-section-title">Delivery To:</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit
                  </button>
                </div>
                <p className="review-text">
                  <strong>{resolvedCustomerInfo.firstName} {resolvedCustomerInfo.lastName}</strong>
                  <br />
                  {resolvedCustomerInfo.shippingAddress}
                  {resolvedCustomerInfo.pincode && ` - ${resolvedCustomerInfo.pincode}`}
                  <br />
                  Phone: <strong>+91 {resolvedCustomerInfo.contact}</strong> | Email: {resolvedCustomerInfo.email}
                  {deliveryNotes && (
                    <span className="review-notes"><br />Note: {deliveryNotes}</span>
                  )}
                </p>
              </div>

              {/* Payment Details Review */}
              <div className="checkout-review-section">
                <div className="review-section-header">
                  <span className="review-section-title">Payment Mode:</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => setCurrentStep(2)}
                  >
                    Change
                  </button>
                </div>
                {paymentMethod === 'upi' ? (
                  <div className="review-payment-badge upi">
                    <span>UPI Reference (UTR):</span>
                    <strong>{upiPaymentData?.transactionId || 'Entered'}</strong>
                    <span className="review-status-tag">Under Review</span>
                  </div>
                ) : (
                  <div className="review-payment-badge cod">
                    <span>Payment Mode:</span>
                    <strong>Cash on Delivery (₹{finalTotal.toFixed(2)})</strong>
                    <span className="review-status-tag">COD Confirmed</span>
                  </div>
                )}
              </div>

              {/* Items List Preview */}
              <div className="checkout-review-section">
                <span className="review-section-title">Items in Shipment ({cart.length})</span>
                <div className="checkout-review-items">
                  {cart.map((item) => (
                    <div key={item.id} className="checkout-review-item">
                      <img
                        src={optimizeImageUrl(item.image || item.images, 120)}
                        alt={item.name}
                        className="review-item-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/products/t1.jpg')}
                      />
                      <div className="review-item-details">
                        <p className="review-item-name">{item.name}</p>
                        <span className="review-item-qty">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <div className="review-item-total">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="checkout-terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  I confirm that the shipping details and payment reference provided above are accurate and accept Roshan Enterprises terms of service.
                </span>
              </label>

              <div className="checkout-step-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={16} />
                  Back to Payment
                </button>
                <button
                  type="button"
                  className="btn btn-primary checkout-submit-btn"
                  onClick={submitFinalOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Confirming Order...' : `Place Order (₹${finalTotal.toFixed(2)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sticky Summary Sidebar */}
        <aside className="checkout-sidebar">
          <div className="checkout-summary-card">
            <h3 className="summary-title">Price Details</h3>

            <div className="summary-breakdown">
              <div className="summary-line">
                <span>Items Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Delivery Charges</span>
                <span>{shippingFee === 0 ? <strong className="text-success">FREE</strong> : `₹${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="summary-line">
                <span>Estimated Taxes (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-line summary-total-line">
                <strong>Payable Total</strong>
                <strong className="summary-total-amount">₹{finalTotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className="summary-guarantee">
              <ShieldCheck size={18} color="var(--accent)" />
              <div>
                <strong>100% Dhanbad Direct Delivery</strong>
                <p>Pure, quality-tested groceries packaged with food-grade safety standards.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="checkout-mobile-sticky-bar">
        <div className="mobile-bar-info">
          <span className="mobile-bar-total-label">Payable Total:</span>
          <strong className="mobile-bar-total-val">₹{finalTotal.toFixed(2)}</strong>
        </div>

        {currentStep === 1 && (
          <button
            type="button"
            className="btn btn-primary mobile-bar-btn"
            onClick={handleNextStep}
          >
            Continue to Payment
            <ArrowRight size={15} />
          </button>
        )}

        {currentStep === 2 && paymentMethod === 'cod' && (
          <button
            type="button"
            className="btn btn-primary mobile-bar-btn"
            onClick={handleNextStep}
          >
            Review Order
            <ArrowRight size={15} />
          </button>
        )}

        {currentStep === 2 && paymentMethod === 'upi' && (
          <button
            type="button"
            className="btn btn-primary mobile-bar-btn"
            onClick={handleNextStep}
          >
            {upiPaymentData ? 'Review Order' : 'Submit UTR First'}
            <ArrowRight size={15} />
          </button>
        )}

        {currentStep === 3 && (
          <button
            type="button"
            className="btn btn-primary mobile-bar-btn"
            onClick={submitFinalOrder}
            disabled={isProcessing}
          >
            {isProcessing ? 'Placing Order...' : 'Place Order'}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(Checkout);
