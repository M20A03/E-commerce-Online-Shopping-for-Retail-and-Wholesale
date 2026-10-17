import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { Package, Calendar, CreditCard, Truck, CircleCheck, PackageCheck, MapPinned } from 'lucide-react';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './OrderHistory.css';

const OrderHistory = () => {
    const { user } = useAuth();
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!user) {
            setOrders([]);
            setIsLoading(false);
            return undefined;
        }

        setIsLoading(true);
        const orderQuery = query(collection(db, 'orders'), where('userId', '==', user.id));

        const unsubscribe = onSnapshot(orderQuery, (snapshot) => {
            const firestoreOrders = snapshot.docs.map((docItem) => {
                const data = docItem.data();
                return {
                    ...data,
                    id: data.id || docItem.id
                };
            });

            const legacyOrders = (JSON.parse(localStorage.getItem('luxe_orders') || '[]') || [])
                .filter((orderEntry) => orderEntry[0] === user.email)
                .map((orderEntry) => orderEntry[1]);

            const mergedOrders = [...firestoreOrders, ...legacyOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
            setOrders(mergedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error('Error fetching orders:', error);
            setOrders([]);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredOrders = useMemo(() => {
        if (statusFilter === 'all') {
            return orders;
        }

        return orders.filter((item) => (item.status || '').toLowerCase() === statusFilter);
    }, [orders, statusFilter]);

    if (!user) return null;

    const getTrackingSteps = (status = '') => {
        const normalized = status.toLowerCase();
        const finalStep = normalized.includes('deliver') ? 4 : normalized.includes('ship') ? 3 : normalized.includes('pack') ? 2 : 1;

        return [
            { label: 'Order placed', done: finalStep >= 1, icon: Package },
            { label: 'Packed', done: finalStep >= 2, icon: PackageCheck },
            { label: 'Shipped', done: finalStep >= 3, icon: Truck },
            { label: 'Delivered', done: finalStep >= 4, icon: CircleCheck },
        ];
    };

    const getPaymentMethodLabel = (method = '') => {
        if (method === 'card') return 'Credit / Debit Card';
        if (method === 'upi') return 'UPI';
        if (method === 'cod') return 'Cash on Delivery';
        return 'Unknown';
    };

    const getDeliveryMeta = (order) => {
        const sourceDate = order.estimatedDeliveryDate
            ? new Date(order.estimatedDeliveryDate)
            : new Date(new Date(order.date).getTime() + 3 * 24 * 60 * 60 * 1000);

        // eslint-disable-next-line
        const daysLeft = Math.ceil((sourceDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

        if (daysLeft <= 0) {
            return {
                dateText: sourceDate.toLocaleDateString(),
                daysText: 'Expected today'
            };
        }

        return {
            dateText: sourceDate.toLocaleDateString(),
            daysText: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
        };
    };

    const getOrderStatusClass = (status = '') => {
        const normalized = status.toLowerCase();

        if (normalized.includes('deliver')) {
            return 'delivered';
        }

        if (normalized.includes('cancel')) {
            return 'cancelled';
        }

        if (normalized.includes('ship') || normalized.includes('process') || normalized.includes('confirm')) {
            return 'processing';
        }

        return 'default';
    };

    return (
        <div className="container section animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h1 className="heading-1">Order History</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter orders by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out for delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <Link to="/categories" className="btn btn-outline">
                        Continue Shopping
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                    <h3 className="heading-3 mb-2">Loading orders...</h3>
                    <p className="text-muted">Fetching your order data from database.</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                    <Package size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1.5rem' }} />
                    <h3 className="heading-3 mb-2">No matching orders found</h3>
                    <p className="text-muted mb-6">Try another filter or place a new order.</p>
                    <Link to="/categories" className="btn btn-primary">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map((order, index) => {
                        const isExpanded = expandedOrderId === order.id;
                        const trackingSteps = getTrackingSteps(order.status);
                        const deliveryMeta = getDeliveryMeta(order);

                        return (
                        <div key={index} className="card order-card">

                            {/* Order Header */}
                            <div className="order-header">
                                <div>
                                    <span className="order-id">Order {order.id}</span>
                                    <div className="flex items-center gap-2 mt-1 text-muted" style={{ fontSize: '0.9rem' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`order-status ${getOrderStatusClass(order.status)}`}>{order.status}</div>
                                    <div className="order-total mt-1" style={{ color: '#000', fontWeight: '800' }}>₹{order.total.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Order Items Summary visually */}
                            <div className="order-items-preview">
                                {order.items.slice(0, 3).map((item, i) => (
                                    <div key={i} className="order-preview-img-wrapper" title={`${item.name} x${item.quantity}`}>
                                        <img
                                            src={optimizeImageUrl(item.image, 120)}
                                            alt={item.name}
                                            className="order-preview-img"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => handleImageError(e, '/products/t1.jpg')}
                                        />
                                        <span className="order-preview-qty">{item.quantity}</span>
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="order-preview-more">
                                        +{order.items.length - 3}
                                    </div>
                                )}
                            </div>

                            {/* Order Footer */}
                            <div className="order-footer">
                                <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.9rem' }}>
                                    <CreditCard size={16} />
                                    <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                                    <span>•</span>
                                    <span>{order.paymentStatus || 'Paid'}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                    {isExpanded ? 'Hide Tracking' : 'Track Order'}
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="order-tracking">
                                    <div className="order-tracking__header">
                                        <h4>Product Tracking</h4>
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
                                        {order.items.map((item, productIndex) => (
                                            <div key={`${item.id}-${productIndex}`} className="tracked-product">
                                                <img
                                                    src={optimizeImageUrl(item.image, 160)}
                                                    alt={item.name}
                                                    className="tracked-product__img"
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(e) => handleImageError(e, '/products/t1.jpg')}
                                                />
                                                <div className="tracked-product__meta">
                                                    <p className="tracked-product__name">{item.name}</p>
                                                    <p className="tracked-product__qty">Qty: {item.quantity}</p>
                                                </div>
                                                <span className="tracked-product__status">{order.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
