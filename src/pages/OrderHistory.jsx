// IMPROVEMENT: Enterprise Touch-Friendly Mobile Order History with Real-Time Firestore Sync, Normalized Statuses, Direct WhatsApp Support, and Item Previews
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useToast } from '../context/ToastContext';
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  CircleCheck,
  PackageCheck,
  MapPinned,
  Search,
  LogIn,
  ShoppingBag,
  Copy,
  MessageSquare,
  Phone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STEP_KEYS,
  normalizeOrderStatus,
  getOrderStepIndex
} from '../utils/orderLifecycle';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId') || searchParams.get('id') || searchParams.get('order_id') || '';
  const urlStatus = searchParams.get('status') || '';

  const [expandedOrderId, setExpandedOrderId] = useState(urlOrderId || null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(urlStatus ? urlStatus.toLowerCase() : 'all');
  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    if (urlOrderId) {
      setSearchQuery(urlOrderId);
      setExpandedOrderId(urlOrderId);
    }
    if (urlStatus) {
      setStatusFilter(urlStatus.toLowerCase());
    }
  }, [urlOrderId, urlStatus]);

  // Load orders from LocalStorage immediately, and subscribe to Firestore if user logged in
  useEffect(() => {
    setIsLoading(true);

    // Retrieve local orders
    let localOrders = [];
    try {
      const roshan = JSON.parse(localStorage.getItem('roshan_orders') || '[]');
      const luxe = (JSON.parse(localStorage.getItem('luxe_orders') || '[]') || []).map((entry) =>
        Array.isArray(entry) ? entry[1] : entry
      );
      localOrders = [...roshan, ...luxe];
    } catch (e) {
      console.warn('Error reading local orders:', e);
    }

    // If user is not logged in, display local orders directly
    if (!user) {
      setOrders(localOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      setIsLoading(false);
      return undefined;
    }

    // If user is logged in, query Firestore
    const orderQuery = query(collection(db, 'orders'), where('userId', '==', user.id));

    const unsubscribe = onSnapshot(
      orderQuery,
      (snapshot) => {
        const firestoreOrders = snapshot.docs.map((docItem) => {
          const data = docItem.data();
          return {
            ...data,
            id: data.id || docItem.id
          };
        });

        // Merge firestore + local orders, deduplicate by ID
        const map = new Map();
        firestoreOrders.forEach((o) => map.set(o.id, o));
        localOrders.forEach((o) => {
          if (!map.has(o.id)) map.set(o.id, o);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        );

        setOrders(merged);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching Firestore orders:', error);
        setOrders(localOrders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      // Status filter
      if (statusFilter !== 'all') {
        const canonical = normalizeOrderStatus(item.status);
        if (canonical.toLowerCase() !== statusFilter && (item.status || '').toLowerCase() !== statusFilter) {
          return false;
        }
      }

      // Search query filter (Order ID, customer name, or item name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(item.id || '').toLowerCase().includes(q);
        const matchesName = `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`
          .toLowerCase()
          .includes(q);
        const matchesItem = (item.items || []).some((prod) =>
          String(prod.name || '').toLowerCase().includes(q)
        );
        return matchesId || matchesName || matchesItem;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const copyOrderRef = (id) => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      if (addToast) addToast(`Copied #${id}`, 'success');
      setTimeout(() => setCopiedId(''), 2000);
    }
  };

  const getOrderStatusBadge = (rawStatus) => {
    const canonical = normalizeOrderStatus(rawStatus);
    const label = ORDER_STATUS_LABELS[canonical] || rawStatus || 'Order Placed';

    let badgeClass = 'status-default';
    if (canonical === ORDER_STATUSES.DELIVERED) badgeClass = 'status-delivered';
    else if (canonical === ORDER_STATUSES.OUT_FOR_DELIVERY) badgeClass = 'status-out';
    else if (canonical === ORDER_STATUSES.DISPATCHED) badgeClass = 'status-dispatched';
    else if (canonical === ORDER_STATUSES.PACKED) badgeClass = 'status-packed';
    else if (canonical === ORDER_STATUSES.CONFIRMED) badgeClass = 'status-confirmed';
    else if (canonical === ORDER_STATUSES.CANCELLED) badgeClass = 'status-cancelled';

    return <span className={`order-status-badge ${badgeClass}`}>{label}</span>;
  };

  const getPaymentMethodLabel = (method = '') => {
    const norm = String(method).toLowerCase();
    if (norm === 'card') return 'Credit / Debit Card';
    if (norm === 'upi') return 'Direct UPI';
    if (norm === 'cod') return 'Cash on Delivery';
    return 'Online Payment';
  };

  const getDeliveryMeta = (order) => {
    if (order.eta) {
      return { dateText: order.eta, daysText: 'Dynamic Pincode Window' };
    }
    const sourceDate = order.estimatedDeliveryDate
      ? new Date(order.estimatedDeliveryDate)
      : new Date(new Date(order.date || Date.now()).getTime() + 3 * 24 * 60 * 60 * 1000);

    const daysLeft = Math.ceil((sourceDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    if (daysLeft <= 0) {
      return {
        dateText: sourceDate.toLocaleDateString('en-IN'),
        daysText: 'Expected today'
      };
    }

    return {
      dateText: sourceDate.toLocaleDateString('en-IN'),
      daysText: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
    };
  };

  return (
    <div className="orders-page-container container section animate-fade-in">
      {/* Top Header */}
      <div className="orders-header-row">
        <div>
          <h1 className="orders-page-title">Order History</h1>
          <p className="orders-page-subtitle">
            Review your verified grocery shipments, payment status, and dispatch progress.
          </p>
        </div>
        <div className="orders-header-actions">
          <Link to="/categories" className="btn btn-outline orders-head-btn">
            <ShoppingBag size={15} />
            Shop Groceries
          </Link>
          <Link to="/track-order" className="btn btn-primary orders-head-btn">
            <Truck size={15} />
            Track Order Live
          </Link>
        </div>
      </div>

      {/* Guest Sync Banner if not logged in */}
      {!user && (
        <div className="orders-guest-banner">
          <div>
            <strong className="guest-banner-title">Viewing Local Device Orders</strong>
            <p className="guest-banner-text">
              Sign in with your Google account to automatically synchronize your verified orders across all mobile and desktop devices.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline guest-signin-btn"
            onClick={loginWithGoogle}
          >
            <LogIn size={15} />
            Sign in with Google
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="orders-filter-bar">
        <div className="orders-search-input-wrap">
          <Search size={16} className="orders-search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID or Product Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
          className="orders-status-dropdown"
        >
          <option value="all">All statuses</option>
          <option value="order_placed">Order Placed</option>
          <option value="confirmed">Payment Confirmed</option>
          <option value="packed">Packed</option>
          <option value="dispatched">Dispatched</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card orders-loading-card">
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
          <h3 className="heading-3 mb-2">Loading Orders...</h3>
          <p className="text-muted">Fetching verified orders from Dhanbad central repository.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card orders-empty-card">
          <Package size={52} color="var(--accent)" style={{ margin: '0 auto 1.25rem', opacity: 0.8 }} />
          <h3 className="heading-3 mb-2">No Matching Orders Found</h3>
          <p className="text-muted mb-6" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {orders.length === 0
              ? 'You have not placed any orders on this device yet. Explore our fresh grocery items to get started!'
              : 'Try clearing your search query or choosing another status filter.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/categories" className="btn btn-primary">
              Start Shopping
            </Link>
            <Link to="/track-order" className="btn btn-outline">
              Lookup by Tracking Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order, index) => {
            const isExpanded = expandedOrderId === order.id;
            const deliveryMeta = getDeliveryMeta(order);
            const canonical = normalizeOrderStatus(order.status);
            const stepIndex = getOrderStepIndex(canonical);

            return (
              <div key={order.id || index} className="order-card-modern">
                {/* Header */}
                <div className="order-card-top">
                  <div>
                    <div className="order-id-group">
                      <strong className="order-id-text">#{order.id}</strong>
                      <button
                        type="button"
                        className="order-copy-pill"
                        onClick={() => copyOrderRef(order.id)}
                        title="Copy Order ID"
                      >
                        <Copy size={11} />
                        {copiedId === order.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="order-date-text">
                      <Calendar size={13} />
                      <span>{new Date(order.date || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="order-card-status-box">
                    {getOrderStatusBadge(order.status)}
                    <div className="order-amount-text">
                      ₹{Number(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Items Thumbnails Preview */}
                <div className="order-thumbnails-row">
                  {(order.items || []).slice(0, 5).map((item, i) => (
                    <div key={i} className="order-thumb-wrap" title={`${item.name} x${item.quantity}`}>
                      <img
                        src={optimizeImageUrl(item.image || item.images, 120)}
                        alt={item.name}
                        className="order-thumb-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/products/t1.jpg')}
                      />
                      <span className="order-thumb-qty">{item.quantity}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 5 && (
                    <div className="order-thumb-more">
                      +{(order.items || []).length - 5}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="order-card-bottom">
                  <div className="order-pay-info">
                    <CreditCard size={14} />
                    <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    <span className="dot-sep">•</span>
                    <span className="order-pay-status-pill">{order.paymentVerificationStatus || order.paymentStatus || 'Verified'}</span>
                  </div>

                  <div className="order-action-buttons">
                    <a
                      href={`https://wa.me/917004634675?text=Hello%20Roshan%20Enterprises,%20I%20am%20inquiring%20about%20Order%20${encodeURIComponent(order.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="order-wa-icon-btn"
                      title="WhatsApp Support for this Order"
                    >
                      <MessageSquare size={14} color="#22c55e" />
                    </a>

                    <button
                      type="button"
                      className="btn btn-outline order-toggle-btn"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? 'Hide Items' : 'View Items'}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary order-track-btn"
                      onClick={() => navigate(`/track-order?id=${encodeURIComponent(order.id)}`)}
                    >
                      <Truck size={14} />
                      Track Live
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="order-expanded-drawer animate-fade-in">
                    <div className="expanded-eta-bar">
                      <Truck size={15} color="var(--accent)" />
                      <span>Delivery Target: <strong>{deliveryMeta.dateText}</strong></span>
                      {order.dispatchInfo?.courierName && (
                        <span className="courier-tag">Via {order.dispatchInfo.courierName}</span>
                      )}
                    </div>

                    <div className="expanded-products-list">
                      {(order.items || []).map((item, productIndex) => (
                        <div key={`${item.id}-${productIndex}`} className="expanded-product-row">
                          <img
                            src={optimizeImageUrl(item.image || item.images, 120)}
                            alt={item.name}
                            className="expanded-product-img"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => handleImageError(e, '/products/t1.jpg')}
                          />
                          <div className="expanded-product-info">
                            <p className="expanded-product-name">{item.name}</p>
                            <span className="expanded-product-qty">
                              Quantity: {item.quantity} × ₹{item.price}
                            </span>
                          </div>
                          <span className="expanded-product-price">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.customer && (
                      <div className="expanded-address-box">
                        <strong>Shipping Destination:</strong>
                        <p>
                          {order.customer.firstName} {order.customer.lastName}
                          <br />
                          {order.customer.shippingAddress}
                          <br />
                          Contact: <strong>+91 {order.customer.contact}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderHistory);
