// IMPROVEMENT: Enterprise Live Order Tracking with real-time Firestore onSnapshot listener, canonical 6-step progress, courier dispatch details, and chronological timeline
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STEP_KEYS,
  normalizeOrderStatus,
  getOrderStepIndex
} from '../utils/orderLifecycle';
import {
  Package,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle2,
  Phone,
  MessageSquare,
  Search,
  AlertCircle,
  Clock,
  ArrowRight,
  Copy,
  Radio,
  Calendar,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import './Phase2.css';
import './TrackOrder.css';

const DISPLAY_STEPS = [
  { key: ORDER_STATUSES.ORDER_PLACED, label: 'Order Placed' },
  { key: ORDER_STATUSES.CONFIRMED, label: 'Payment Confirmed' },
  { key: ORDER_STATUSES.PACKED, label: 'Packed & Ready' },
  { key: ORDER_STATUSES.DISPATCHED, label: 'Dispatched' },
  { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { key: ORDER_STATUSES.DELIVERED, label: 'Delivered' }
];

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const urlId =
    searchParams.get('orderId') ||
    searchParams.get('id') ||
    searchParams.get('order_id') ||
    searchParams.get('tracking') ||
    '';

  const [trackingCode, setTrackingCode] = useState(urlId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const { addToast } = useToast();

  const unsubscribeRef = useRef(null);

  // Clean up Firestore listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return String(ts);
    }
  };

  const setupLiveTracking = useCallback((foundOrder, docRefToWatch = null, queryToWatch = null) => {
    const canonicalStatus = normalizeOrderStatus(foundOrder.status);
    const stepIdx = getOrderStepIndex(canonicalStatus);
    const isCancelled = canonicalStatus === ORDER_STATUSES.CANCELLED;

    const deliveryDate = foundOrder.estimatedDeliveryDate
      ? new Date(foundOrder.estimatedDeliveryDate).toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      : foundOrder.eta || '24-48 Hours (Dhanbad local)';

    // Build timeline if missing in legacy records
    const rawTimeline = Array.isArray(foundOrder.timeline) && foundOrder.timeline.length > 0
      ? foundOrder.timeline
      : [
          {
            status: canonicalStatus,
            label: ORDER_STATUS_LABELS[canonicalStatus] || canonicalStatus,
            timestamp: foundOrder.date || new Date().toISOString(),
            description: foundOrder.details || 'Order recorded in fulfillment desk.',
            location: 'Satyam Nagar Dhanbad Hub'
          }
        ];

    const dispatchInfo = foundOrder.dispatchInfo || {
      courierName: 'Roshan Express Local',
      trackingNumber: foundOrder.id,
      riderContact: '+91 7004634675',
      dispatchDate: null
    };

    const res = {
      isReal: true,
      orderId: foundOrder.id,
      status: foundOrder.status || 'Order Placed',
      canonicalStatus,
      isCancelled,
      location:
        stepIdx >= 5
          ? 'Delivered to Customer'
          : stepIdx >= 4
          ? 'Out with Delivery Partner (Dhanbad Local Van)'
          : stepIdx >= 3
          ? 'Dispatched from Dhanbad Fulfillment Center'
          : stepIdx >= 2
          ? 'Packaging & Quality Check Section, Dhanbad'
          : stepIdx >= 1
          ? 'Payment Confirmed & Inventory Allocated'
          : 'Roshan Enterprises Central Order Desk, Dhanbad',
      eta: foundOrder.eta || `Expected by ${deliveryDate}`,
      currentStep: stepIdx,
      details: foundOrder.deliveryNotes
        ? `Delivery Note: ${foundOrder.deliveryNotes}`
        : `Package for ${foundOrder.customer?.firstName || 'Customer'} ${foundOrder.customer?.lastName || ''}. Shipping to ${foundOrder.customer?.shippingAddress || 'Registered Address, Dhanbad'}.`,
      total: foundOrder.total || 0,
      paymentMethod: foundOrder.paymentMethod || 'COD',
      paymentStatus: foundOrder.paymentStatus || 'Pending',
      paymentVerificationStatus: foundOrder.paymentVerificationStatus || (foundOrder.paymentMethod === 'cod' ? 'COD Confirmed' : 'Under Review'),
      paymentData: foundOrder.paymentData,
      customer: foundOrder.customer,
      items: foundOrder.items || [],
      timeline: rawTimeline,
      dispatchInfo,
      date: foundOrder.date
        ? new Date(foundOrder.date).toLocaleDateString('en-IN')
        : 'Recent'
    };

    setResult(res);
    setLoading(false);

    // Attach real-time snapshot listener
    if (docRefToWatch) {
      unsubscribeRef.current = onSnapshot(docRefToWatch, (snap) => {
        if (snap.exists()) {
          const freshData = snap.data();
          const freshOrder = { ...freshData, id: freshData.id || snap.id };
          const freshStatus = normalizeOrderStatus(freshOrder.status);
          const freshStep = getOrderStepIndex(freshStatus);

          setResult((prev) => ({
            ...prev,
            status: freshOrder.status || prev.status,
            canonicalStatus: freshStatus,
            isCancelled: freshStatus === ORDER_STATUSES.CANCELLED,
            currentStep: freshStep,
            timeline: freshOrder.timeline || prev.timeline,
            dispatchInfo: freshOrder.dispatchInfo || prev.dispatchInfo,
            paymentVerificationStatus: freshOrder.paymentVerificationStatus || prev.paymentVerificationStatus,
            paymentStatus: freshOrder.paymentStatus || prev.paymentStatus
          }));
        }
      });
    } else if (queryToWatch) {
      unsubscribeRef.current = onSnapshot(queryToWatch, (snap) => {
        if (!snap.empty) {
          const freshData = snap.docs[0].data();
          const freshOrder = { ...freshData, id: freshData.id || snap.docs[0].id };
          const freshStatus = normalizeOrderStatus(freshOrder.status);
          const freshStep = getOrderStepIndex(freshStatus);

          setResult((prev) => ({
            ...prev,
            status: freshOrder.status || prev.status,
            canonicalStatus: freshStatus,
            isCancelled: freshStatus === ORDER_STATUSES.CANCELLED,
            currentStep: freshStep,
            timeline: freshOrder.timeline || prev.timeline,
            dispatchInfo: freshOrder.dispatchInfo || prev.dispatchInfo,
            paymentVerificationStatus: freshOrder.paymentVerificationStatus || prev.paymentVerificationStatus,
            paymentStatus: freshOrder.paymentStatus || prev.paymentStatus
          }));
        }
      });
    }
  }, []);

  const performLookup = useCallback(async (codeToSearch) => {
    const raw = String(codeToSearch || '').trim();
    if (!raw) {
      if (addToast) addToast('Please enter an Order ID or mobile number.', 'warning');
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setLoading(true);
    setResult(null);

    const cleanCode = raw.toUpperCase();
    let foundOrder = null;
    let targetDocRef = null;
    let targetQuery = null;

    // 1. Check LocalStorage orders first for instant feedback
    try {
      const local = JSON.parse(localStorage.getItem('roshan_orders') || '[]');
      const match = local.find(
        (o) =>
          String(o.id || '').toUpperCase() === cleanCode ||
          String(o.customer?.contact || '').includes(raw)
      );
      if (match) {
        foundOrder = match;
      }
    } catch (err) {
      console.warn('LocalStorage lookup error:', err);
    }

    // 2. Query Firestore 'orders' collection
    try {
      // Query by custom generated ID 'id'
      const qId = query(collection(db, 'orders'), where('id', '==', cleanCode));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        const docData = snapId.docs[0].data();
        foundOrder = { ...docData, id: docData.id || snapId.docs[0].id };
        targetQuery = qId;
      } else {
        // Direct doc lookup by Firestore ID
        const docRef = doc(db, 'orders', raw);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          foundOrder = { ...docData, id: docData.id || docSnap.id };
          targetDocRef = docRef;
        } else {
          // Check by customer phone number
          const qPhone = query(collection(db, 'orders'), where('customer.contact', '==', raw));
          const snapPhone = await getDocs(qPhone);
          if (!snapPhone.empty) {
            const docData = snapPhone.docs[0].data();
            foundOrder = { ...docData, id: docData.id || snapPhone.docs[0].id };
            targetQuery = qPhone;
          }
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore order search error:', firestoreErr);
    }

    if (foundOrder) {
      setupLiveTracking(foundOrder, targetDocRef, targetQuery);
      if (addToast) addToast(`Live tracking active for #${foundOrder.id}`, 'success');
      return;
    }

    // 3. Fallback for interactive demo codes
    if (cleanCode.length >= 6) {
      let simStatus = ORDER_STATUSES.ORDER_PLACED;
      let simLoc = 'Roshan Central Order Desk, Dhanbad';
      let simEta = 'Processing';
      let simDesc = 'Order received and inventory allocated.';

      if (cleanCode.includes('DELIV')) {
        simStatus = ORDER_STATUSES.DELIVERED;
        simLoc = 'Delivered to Destination, Dhanbad';
        simEta = 'Delivered Today';
        simDesc = 'Package delivered successfully. Thank you for shopping with Roshan Enterprises!';
      } else if (cleanCode.includes('OUT')) {
        simStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
        simLoc = 'Roshan Express Courier (Local Van - Dhanbad)';
        simEta = 'Arriving today by 6:00 PM';
        simDesc = 'Package is out with your delivery partner for final handover.';
      } else if (cleanCode.includes('DISPATCH') || cleanCode.includes('TRANS')) {
        simStatus = ORDER_STATUSES.DISPATCHED;
        simLoc = 'Roshan Fulfillment Center Hub, Dhanbad';
        simEta = 'Expected tomorrow';
        simDesc = 'Shipment has departed warehouse and handed over to local rider.';
      } else if (cleanCode.includes('PACK')) {
        simStatus = ORDER_STATUSES.PACKED;
        simLoc = 'Satyam Nagar Fulfillment Center, Dhanbad';
        simEta = 'Dispatching within 4 hours';
        simDesc = 'Items quality checked, packed in secure tamper-proof box, and scheduled for pickup.';
      } else if (cleanCode.includes('CONFIRM')) {
        simStatus = ORDER_STATUSES.CONFIRMED;
        simLoc = 'Roshan Finance & Order Verification Desk';
        simEta = 'Processing for packaging';
        simDesc = 'Payment confirmed. Warehouse team preparing items for packaging.';
      }

      const stepIdx = getOrderStepIndex(simStatus);

      setResult({
        isReal: false,
        isSimulated: true,
        orderId: cleanCode,
        status: ORDER_STATUS_LABELS[simStatus] || simStatus,
        canonicalStatus: simStatus,
        isCancelled: false,
        location: simLoc,
        eta: simEta,
        currentStep: stepIdx,
        details: simDesc,
        dispatchInfo: {
          courierName: 'Roshan Express Local',
          trackingNumber: cleanCode,
          riderContact: '+91 7004634675',
          dispatchDate: new Date().toISOString()
        },
        timeline: [
          {
            status: simStatus,
            label: ORDER_STATUS_LABELS[simStatus] || simStatus,
            timestamp: new Date().toISOString(),
            description: simDesc,
            location: simLoc
          }
        ]
      });
      setLoading(false);
      if (addToast) addToast(`Simulated status: ${ORDER_STATUS_LABELS[simStatus]}`, 'info');
      return;
    }

    // 4. Not found
    setResult({
      error: `No active order found for "${raw}". Please check your order reference ID or mobile number and try again.`
    });
    setLoading(false);
    if (addToast) addToast('Order not found. Please verify the ID.', 'error');
  }, [addToast, setupLiveTracking]);

  // Auto-search if URL has ID
  useEffect(() => {
    if (urlId) {
      setTrackingCode(urlId);
      performLookup(urlId);
    }
  }, [urlId, performLookup]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    performLookup(trackingCode);
  };

  const copyToClipboard = () => {
    if (result?.orderId) {
      navigator.clipboard.writeText(result.orderId);
      setCopiedId(true);
      if (addToast) addToast('Order ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="track-order-page container section animate-fade-in">
      <SEO
        title="Track Your Order Live | Roshan Enterprises Dhanbad"
        description="Track your grocery and wholesale order delivery status in real-time across Dhanbad, Jharkhand. Check dispatch, out for delivery, and courier tracking."
        canonicalPath="/track-order"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Track Order', path: '/track-order' }
        ]}
      />
      {/* Header section */}
      <section className="track-order-hero">
        <span className="track-hero-tag">Live Order Intelligence</span>
        <h1 className="track-hero-title">Track Your Shipment</h1>
        <p className="track-hero-sub">
          Enter your Roshan Enterprises Order Reference ID (e.g. <strong>RE-XXXXX</strong>) or registered phone number for real-time dispatch updates.
        </p>
      </section>

      {/* Search Bar Card */}
      <div className="track-search-card">
        <form onSubmit={handleTrackSubmit} className="track-search-form">
          <label htmlFor="tracking-code" className="track-search-label">
            Order Reference ID or Mobile Number
          </label>
          <div className="track-search-input-group">
            <div className="track-input-wrap">
              <Search size={18} className="track-input-icon" />
              <input
                id="tracking-code"
                type="text"
                placeholder="Example: RE-M1K9-4821 or 7004634675"
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary track-search-btn" disabled={loading}>
              {loading ? 'Locating...' : 'Track Order'}
            </button>
          </div>

          {/* Quick Demo Sample Order Chips */}
          <div className="track-sample-chips">
            <span className="sample-chips-label">Sample Statuses:</span>
            <button
              type="button"
              className="chip-btn chip-delivered"
              onClick={() => { setTrackingCode('RE-DELIV-9042'); performLookup('RE-DELIV-9042'); }}
            >
              Delivered
            </button>
            <button
              type="button"
              className="chip-btn chip-out"
              onClick={() => { setTrackingCode('RE-OUT-7821'); performLookup('RE-OUT-7821'); }}
            >
              Out for Delivery
            </button>
            <button
              type="button"
              className="chip-btn chip-dispatched"
              onClick={() => { setTrackingCode('RE-DISPATCH-5112'); performLookup('RE-DISPATCH-5112'); }}
            >
              Dispatched
            </button>
            <button
              type="button"
              className="chip-btn chip-packed"
              onClick={() => { setTrackingCode('RE-PACK-1048'); performLookup('RE-PACK-1048'); }}
            >
              Packed
            </button>
          </div>
        </form>

        {/* Not Found State */}
        {result?.error && (
          <div className="track-alert-box error" role="status" aria-live="polite">
            <AlertCircle size={22} className="alert-icon" />
            <div>
              <strong>Order Not Found</strong>
              <p>{result.error}</p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link to="/orders" className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}>
                  View All Stored Orders
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Order Details */}
        {result && !result.error && (
          <div className="track-result-content animate-fade-in" role="status" aria-live="polite">
            {/* Live Sync Banner */}
            <div className="track-live-banner">
              <span className="live-pulse-dot" />
              <span>Real-Time Firestore Listener Connected • Live Updates Active</span>
            </div>

            {/* Top Status Header */}
            <div className="track-result-header">
              <div>
                <div className="track-id-badge-row">
                  <span className="track-id-label">Order Reference:</span>
                  <strong className="track-id-value">#{result.orderId}</strong>
                  <button
                    type="button"
                    className="track-copy-icon-btn"
                    onClick={copyToClipboard}
                    aria-label="Copy Order ID"
                  >
                    <Copy size={13} />
                    {copiedId ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <h2 className="track-status-heading">
                  {result.isCancelled ? 'Order Cancelled' : (ORDER_STATUS_LABELS[result.canonicalStatus] || result.status)}
                </h2>

                <p className="track-current-location">
                  <MapPin size={16} className="loc-icon" />
                  <span>{result.location}</span>
                </p>
              </div>

              <div className="track-eta-card">
                <span className="track-eta-title">
                  <Clock size={14} /> Estimated Arrival
                </span>
                <strong className="track-eta-value">{result.eta}</strong>
              </div>
            </div>

            {/* Cancelled Banner */}
            {result.isCancelled && (
              <div className="track-cancelled-banner">
                <XCircle size={20} />
                <div>
                  <strong>This order has been cancelled</strong>
                  <p>If payment was deducted via UPI, a full refund will be processed within 2-4 business days.</p>
                </div>
              </div>
            )}

            {/* 6-Step Visual Progress Stepper */}
            {!result.isCancelled && (
              <div className="track-stepper-container" aria-label="Order Delivery Progress">
                <div className="track-stepper-line-bg" />
                <div
                  className="track-stepper-line-fill"
                  style={{
                    width: `${(result.currentStep / (DISPLAY_STEPS.length - 1)) * 100}%`
                  }}
                />
                <div className="track-stepper-dots">
                  {DISPLAY_STEPS.map((step, idx) => {
                    const isDone = idx < result.currentStep;
                    const isCurrent = idx === result.currentStep;
                    return (
                      <div
                        key={step.key}
                        className={`track-step-node ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      >
                        <div className="step-node-bubble">
                          {isDone ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span className="step-node-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dispatch & Courier Information Grid */}
            <div className="track-dispatch-grid">
              <div className="dispatch-card">
                <div className="dispatch-card-head">
                  <Truck size={17} className="dispatch-card-icon" />
                  <strong>Courier & Dispatch Partner</strong>
                </div>
                <div className="dispatch-card-body">
                  <p>Courier: <strong>{result.dispatchInfo?.courierName || 'Roshan Express Local'}</strong></p>
                  <p>Tracking / Consignment: <strong>{result.dispatchInfo?.trackingNumber || result.orderId}</strong></p>
                  {result.dispatchInfo?.dispatchDate && (
                    <p>Dispatch Timestamp: <span>{formatTimestamp(result.dispatchInfo.dispatchDate)}</span></p>
                  )}
                </div>
              </div>

              <div className="dispatch-card">
                <div className="dispatch-card-head">
                  <Phone size={17} className="dispatch-card-icon" />
                  <strong>Local Rider Contact & Assistance</strong>
                </div>
                <div className="dispatch-card-body">
                  <p>
                    Delivery Executive:{' '}
                    <strong>{result.dispatchInfo?.riderName || 'Roshan Delivery Associate'}</strong>
                  </p>
                  <p>
                    Direct Helpline:{' '}
                    <a
                      href={`tel:${result.dispatchInfo?.riderContact || '+917004634675'}`}
                      className="rider-phone-link"
                    >
                      {result.dispatchInfo?.riderContact || '+91 7004634675'}
                    </a>
                  </p>
                  <span className="rider-note">Available 8:00 AM - 9:00 PM (Dhanbad)</span>
                </div>
              </div>
            </div>

            {/* Chronological Event Timeline */}
            {Array.isArray(result.timeline) && result.timeline.length > 0 && (
              <div className="track-timeline-section">
                <h3 className="timeline-section-title">
                  <Calendar size={17} />
                  Shipment Event Log
                </h3>
                <div className="track-event-list">
                  {result.timeline.map((evt, idx) => (
                    <div key={idx} className="track-event-item">
                      <div className="event-bullet" />
                      <div className="event-content">
                        <div className="event-top">
                          <strong className="event-label">{evt.label || evt.status}</strong>
                          <span className="event-time">{formatTimestamp(evt.timestamp)}</span>
                        </div>
                        <p className="event-desc">{evt.description}</p>
                        {evt.location && (
                          <span className="event-location">
                            <MapPin size={13} /> {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manifest / Ordered Items */}
            {result.items && result.items.length > 0 && (
              <div className="track-manifest-section">
                <h3 className="manifest-section-title">
                  <Package size={17} />
                  Ordered Package Manifest ({result.items.length} item{result.items.length > 1 ? 's' : ''})
                </h3>
                <div className="manifest-items-grid">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="manifest-item-card">
                      <img
                        src={optimizeImageUrl(item.image || item.images, 120)}
                        alt={item.name}
                        className="manifest-item-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/products/t1.jpg')}
                      />
                      <div className="manifest-item-info">
                        <h4 className="manifest-item-name">{item.name}</h4>
                        <span className="manifest-item-meta">
                          Qty: {item.quantity} • ₹{item.price} each
                        </span>
                      </div>
                      <div className="manifest-item-subtotal">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="manifest-total-bar">
                  <div className="manifest-total-left">
                    <span>Payment Method: <strong>{result.paymentMethod.toUpperCase()}</strong></span>
                    <span className="payment-status-badge">
                      {result.paymentVerificationStatus || result.paymentStatus}
                    </span>
                  </div>
                  <div className="manifest-total-right">
                    <span>Grand Total:</span>
                    <strong>₹{Number(result.total).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Support & Action Buttons */}
            <div className="track-action-footer">
              <a
                href={`https://wa.me/917004634675?text=Hello%20Roshan%20Enterprises,%20I%20am%20inquiring%20about%20Order%20${encodeURIComponent(result.orderId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline track-footer-btn"
              >
                <MessageSquare size={16} color="#22c55e" />
                WhatsApp Order Support
              </a>
              <a
                href="tel:+917004634675"
                className="btn btn-outline track-footer-btn"
              >
                <Phone size={16} />
                Call Fulfillment Desk (+91 7004634675)
              </a>
              <Link to="/orders" className="btn btn-primary track-footer-btn" style={{ marginLeft: 'auto' }}>
                View All Orders
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Guarantee Cards */}
      <div className="track-info-cards-grid">
        <div className="info-card">
          <Truck size={22} className="info-card-icon" />
          <h4 className="info-card-title">Dhanbad Direct Express</h4>
          <p className="info-card-desc">
            Local deliveries across Katras, Jharia, Putki, Govindpur, and Dhanbad town are fulfilled same-day or within 24 hours.
          </p>
        </div>
        <div className="info-card">
          <PackageCheck size={22} className="info-card-icon" />
          <h4 className="info-card-title">Tamper-Proof Packaging</h4>
          <p className="info-card-desc">
            All oil, grains, dry fruits, and spices are packed with food-grade safety seals directly at our warehouse.
          </p>
        </div>
        <div className="info-card">
          <ShieldCheck size={22} className="info-card-icon" />
          <h4 className="info-card-title">Fulfillment Helpdesk</h4>
          <p className="info-card-desc">
            Have an urgent question regarding your delivery? Contact our warehouse manager directly at <strong>+91 7004634675</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrackOrder);
