import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  CircleCheck,
  PackageCheck,
  MapPinned,
  Search,
  ExternalLink,
  LogIn,
  ShoppingBag
} from 'lucide-react';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId') || searchParams.get('id') || searchParams.get('order_id') || '';
  const urlStatus = searchParams.get('status') || '';

  const [expandedOrderId, setExpandedOrderId] = useState(urlOrderId || null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(urlStatus ? urlStatus.toLowerCase() : 'all');
  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');

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
        // Fallback to local orders
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
        const normStatus = (item.status || '').toLowerCase();
        if (normStatus !== statusFilter) return false;
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

  const getTrackingSteps = (status = '') => {
    const normalized = status.toLowerCase();
    const finalStep = normalized.includes('deliver')
      ? 4
      : normalized.includes('ship') || normalized.includes('transit')
      ? 3
      : normalized.includes('pack')
      ? 2
      : 1;

    return [
      { label: 'Order placed', done: finalStep >= 1, icon: Package },
      { label: 'Packed', done: finalStep >= 2, icon: PackageCheck },
      { label: 'Shipped', done: finalStep >= 3, icon: Truck },
      { label: 'Delivered', done: finalStep >= 4, icon: CircleCheck }
    ];
  };

  const getPaymentMethodLabel = (method = '') => {
    const norm = method.toLowerCase();
    if (norm === 'card') return 'Credit / Debit Card';
    if (norm === 'upi') return 'UPI Payment';
    if (norm === 'cod') return 'Cash on Delivery';
    return 'Online Payment';
  };

  const getDeliveryMeta = (order) => {
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

  const getOrderStatusClass = (status = '') => {
    const normalized = status.toLowerCase();
    if (normalized.includes('deliver')) return 'delivered';
    if (normalized.includes('cancel')) return 'cancelled';
    if (
      normalized.includes('ship') ||
      normalized.includes('process') ||
      normalized.includes('confirm')
    ) {
      return 'processing';
    }
    return 'default';
  };

  return (
    <div className="container section animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Top Header */}
      <div className="orders-header-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="heading-1" style={{ margin: 0 }}>Order History</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Track recent shipments, view order receipts, and manage deliveries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/categories" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
          <Link to="/track-order" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck size={16} />
            Track Order Live
          </Link>
        </div>
      </div>

      {/* Guest Sync Banner if not logged in */}
      {!user && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(212, 163, 115, 0.1)',
            border: '1px solid rgba(212, 163, 115, 0.3)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>Viewing Local Device Orders</strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sign in with your Google account to automatically synchronize and view your order history across all devices.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            onClick={loginWithGoogle}
          >
            <LogIn size={15} />
            Sign in with Google
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by Order ID or Product Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            minWidth: '150px'
          }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="out for delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card text-center" style={{ padding: '4rem 2rem', borderRadius: '16px' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
          <h3 className="heading-3 mb-2">Loading Orders...</h3>
          <p className="text-muted">Fetching your verified order records from database.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem', borderRadius: '16px' }}>
          <Package size={52} color="var(--accent)" style={{ margin: '0 auto 1.25rem', opacity: 0.8 }} />
          <h3 className="heading-3 mb-2">No Matching Orders Found</h3>
          <p className="text-muted mb-6" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {orders.length === 0
              ? 'You have not placed any orders on this device yet. Explore our everyday grocery, tea, and cooking oils to get started!'
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
            const trackingSteps = getTrackingSteps(order.status);
            const deliveryMeta = getDeliveryMeta(order);

            return (
              <div key={order.id || index} className="card order-card" style={{ borderRadius: '16px' }}>
                {/* Order Header */}
                <div className="order-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="order-id">#{order.id}</span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '999px', minHeight: 'unset' }}
                        onClick={() => {
                          navigator.clipboard.writeText(order.id);
                        }}
                        title="Copy Order ID"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted" style={{ fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      <span>{new Date(order.date || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`order-status ${getOrderStatusClass(order.status)}`}>{order.status || 'Processing'}</div>
                    <div className="order-total mt-1" style={{ color: 'var(--text-primary)', fontWeight: '800' }}>
                      ₹{Number(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Order Items Summary visually */}
                <div className="order-items-preview">
                  {(order.items || []).slice(0, 4).map((item, i) => (
                    <div key={i} className="order-preview-img-wrapper" title={`${item.name} x${item.quantity}`}>
                      <img
                        src={optimizeImageUrl(item.image || item.images, 120)}
                        alt={item.name}
                        className="order-preview-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/products/t1.jpg')}
                      />
                      <span className="order-preview-qty">{item.quantity}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 4 && (
                    <div className="order-preview-more">
                      +{(order.items || []).length - 4}
                    </div>
                  )}
                </div>

                {/* Order Footer Actions */}
                <div className="order-footer">
                  <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
                    <CreditCard size={15} />
                    <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    <span>•</span>
                    <span>{order.paymentStatus || 'Paid'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? 'Hide Details' : 'View Items'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => navigate(`/track-order?id=${encodeURIComponent(order.id)}`)}
                    >
                      <Truck size={14} />
                      Track Live
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="order-tracking">
                    <div className="order-tracking__header">
                      <h4>Shipment Timeline</h4>
                      <span className="order-tracking__eta">
                        <MapPinned size={14} /> Estimated delivery: {deliveryMeta.dateText} ({deliveryMeta.daysText})
                      </span>
                    </div>

                    <div className="order-tracking__steps">
                      {trackingSteps.map((step, stepIndex) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.label} className={`tracking-step ${step.done ? 'done' : ''}`}>
                            <div className="tracking-step__icon"><Icon size={14} /></div>
                            <span>{step.label}</span>
                            {stepIndex < trackingSteps.length - 1 && <div className="tracking-step__line" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="tracked-products">
                      {(order.items || []).map((item, productIndex) => (
                        <div key={`${item.id}-${productIndex}`} className="tracked-product">
                          <img
                            src={optimizeImageUrl(item.image || item.images, 160)}
                            alt={item.name}
                            className="tracked-product__img"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => handleImageError(e, '/products/t1.jpg')}
                          />
                          <div className="tracked-product__meta">
                            <p className="tracked-product__name">{item.name}</p>
                            <p className="tracked-product__qty">Qty: {item.quantity} • ₹{item.price} each</p>
                          </div>
                          <span className="tracked-product__status">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {order.customer && (
                      <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <strong>Delivery Address: </strong>
                        <span className="text-muted">
                          {order.customer.firstName} {order.customer.lastName}, {order.customer.shippingAddress} (Ph: {order.customer.contact})
                        </span>
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
