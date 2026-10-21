import { useMemo, useState } from 'react';

const CANONICAL_STATUSES = [
  'ORDER_PLACED',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

export default function OrdersPage({
  error,
  status,
  orders,
  ordersLoading,
  loadOrders,
  updateOrderStatus
}) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [editingDispatchId, setEditingDispatchId] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    courierName: 'Roshan Express Local',
    trackingNumber: '',
    riderName: 'Roshan Delivery Associate',
    riderContact: '+91 7004634675'
  });

  const visibleOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return orders.filter((item) => {
      const itemStatus = (item.status || '').toUpperCase().replace(/[\s-]+/g, '_');

      // Status filter
      if (statusFilter === 'pending_verification') {
        const isUnderReview = (item.paymentVerificationStatus || '').toLowerCase().includes('review');
        const isPlaced = itemStatus === 'ORDER_PLACED' || itemStatus === 'PENDING';
        if (!isUnderReview && !isPlaced) return false;
      } else if (statusFilter !== 'all') {
        if (itemStatus !== statusFilter && (item.status || '').toLowerCase() !== statusFilter) {
          return false;
        }
      }

      // Payment filter
      const paymentMethod = (item.paymentMethod || '').toLowerCase();
      if (paymentFilter === 'cod' && paymentMethod !== 'cod') return false;
      if (paymentFilter === 'upi' && paymentMethod !== 'upi') return false;
      if (paymentFilter === 'verified' && !(item.paymentVerificationStatus || '').toLowerCase().includes('verified')) return false;
      if (paymentFilter === 'review' && !(item.paymentVerificationStatus || '').toLowerCase().includes('review')) return false;

      if (!q) return true;

      const haystack = [
        item.id,
        item.customer?.firstName,
        item.customer?.lastName,
        item.customer?.email,
        item.customer?.contact,
        item.customer?.shippingAddress,
        item.paymentData?.utr,
        item.paymentData?.transactionId,
        item.paymentMethod,
        item.status
      ].join(' ').toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, searchText, statusFilter, paymentFilter]);

  const startEditDispatch = (order) => {
    setEditingDispatchId(order.id);
    setDispatchForm({
      courierName: order.dispatchInfo?.courierName || 'Roshan Express Local',
      trackingNumber: order.dispatchInfo?.trackingNumber || order.id || '',
      riderName: order.dispatchInfo?.riderName || 'Roshan Delivery Associate',
      riderContact: order.dispatchInfo?.riderContact || '+91 7004634675'
    });
  };

  const saveDispatchInfo = (orderId) => {
    updateOrderStatus(orderId, {
      dispatchInfo: {
        ...dispatchForm,
        updatedAt: new Date().toISOString()
      },
      description: `Dispatch metadata updated: Courier ${dispatchForm.courierName}, Tracking #${dispatchForm.trackingNumber}.`
    });
    setEditingDispatchId(null);
  };

  const handleVerifyUPI = (orderId) => {
    updateOrderStatus(orderId, {
      status: 'CONFIRMED',
      label: 'Payment Confirmed',
      paymentVerificationStatus: 'Payment Verified',
      paymentStatus: 'Paid',
      description: 'UPI UTR transaction reference verified and confirmed by Store Admin.',
      location: 'Roshan Finance Desk, Dhanbad'
    });
  };

  const handleRejectUPI = (orderId) => {
    const reason = window.prompt('Enter reason for rejecting UPI payment:', 'Invalid or uncredited UPI UTR');
    if (!reason) return;
    updateOrderStatus(orderId, {
      status: 'CANCELLED',
      label: 'Payment Rejected',
      paymentVerificationStatus: 'Payment Rejected',
      paymentStatus: 'Failed',
      description: `Payment rejected by Admin: ${reason}`,
      location: 'Roshan Finance Desk, Dhanbad'
    });
  };

  const handleQuickTransition = (order, targetStatus, customDesc = '', customLocation = '') => {
    let dispatchPayload = null;
    if (targetStatus === 'DISPATCHED') {
      dispatchPayload = {
        courierName: order.dispatchInfo?.courierName || 'Roshan Express Local',
        trackingNumber: order.dispatchInfo?.trackingNumber || order.id,
        riderName: order.dispatchInfo?.riderName || 'Roshan Delivery Associate',
        riderContact: order.dispatchInfo?.riderContact || '+91 7004634675',
        dispatchDate: new Date().toISOString()
      };
    }

    updateOrderStatus(order.id, {
      status: targetStatus,
      label: targetStatus.replace(/_/g, ' '),
      dispatchInfo: dispatchPayload,
      description: customDesc || `Order transitioned to ${targetStatus} by admin desk.`,
      location: customLocation || 'Dhanbad Fulfillment Hub'
    });
  };

  return (
    <section className="card">
      <div className="row-title">
        <h2>Live Orders & Dispatch Management</h2>
        <div className="row-title-actions">
          <input
            className="search-input"
            type="search"
            placeholder="Search order, customer, phone, UTR..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <select
            className="status-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="status-select"
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="all">All payments</option>
            <option value="upi">UPI / QR Only</option>
            <option value="cod">Cash on Delivery</option>
            <option value="review">Payment Under Review</option>
            <option value="verified">Payment Verified</option>
          </select>
          <button className="btn btn-soft" type="button" onClick={loadOrders} disabled={ordersLoading}>
            {ordersLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {status && <p className="muted" style={{ color: '#16a34a', fontWeight: 600 }}>{status}</p>}
      {error && <p className="error">{error}</p>}

      <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        {visibleOrders.length === 0 ? (
          <p className="muted">No matching orders found.</p>
        ) : (
          visibleOrders.map((order) => {
            const canonical = (order.status || '').toUpperCase().replace(/[\s-]+/g, '_');
            const isUPI = (order.paymentMethod || '').toLowerCase() === 'upi';
            const utr = order.paymentData?.utr || order.paymentData?.transactionId || '';
            const verificationStatus = order.paymentVerificationStatus || (isUPI ? 'Under Review' : 'COD Confirmed');
            const isEditingDispatch = editingDispatchId === order.id;

            return (
              <div
                className="order-item"
                key={order.id}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Order #{order.id}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                      Customer: <strong>{order.customer?.firstName} {order.customer?.lastName}</strong> ({order.customer?.contact || 'No phone'})
                    </p>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>
                      Email: {order.customer?.email} | Placed: {order.date ? new Date(order.date).toLocaleString('en-IN') : 'N/A'}
                    </p>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>
                      Ship to: <strong>{order.customer?.shippingAddress}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent, #d4a373)' }}>
                      ₹{Number(order.total || 0).toFixed(2)}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginTop: '4px',
                        background: canonical === 'DELIVERED' ? '#dcfce7' : canonical === 'DISPATCHED' ? '#e0f2fe' : '#fef3c7',
                        color: canonical === 'DELIVERED' ? '#16a34a' : canonical === 'DISPATCHED' ? '#0369a1' : '#b45309'
                      }}
                    >
                      {canonical.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ margin: '0.85rem 0', padding: '0.65rem 0', borderBottom: '1px dashed #f1f5f9' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Items ({order.items?.length || 0}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {(order.items || []).map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(0,0,0,0.04)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {item.name} × {item.quantity} (₹{item.price})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Payment Verification & UTR Details */}
                <div
                  style={{
                    background: isUPI ? 'rgba(212, 163, 115, 0.08)' : 'rgba(34, 197, 94, 0.05)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    margin: '0.75rem 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Payment Method: </span>
                      <strong style={{ fontSize: '0.88rem' }}>{isUPI ? 'Direct UPI' : 'Cash on Delivery (COD)'}</strong>
                      {isUPI && utr && (
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          UTR: <strong>{utr}</strong>
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: '0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: verificationStatus.includes('Verified') ? '#dcfce7' : verificationStatus.includes('Rejected') ? '#fee2e2' : '#fef3c7',
                          color: verificationStatus.includes('Verified') ? '#16a34a' : verificationStatus.includes('Rejected') ? '#dc2626' : '#b45309'
                        }}
                      >
                        {verificationStatus}
                      </span>
                    </div>

                    {/* UPI Verification Buttons */}
                    {isUPI && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ background: '#22c55e', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                          onClick={() => handleVerifyUPI(order.id)}
                        >
                          ✓ Verify UPI
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                          onClick={() => handleRejectUPI(order.id)}
                        >
                          ✕ Reject UPI
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispatch & Rider Metadata Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    margin: '0.75rem 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Dispatch & Logistics Information
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent, #d4a373)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline' }}
                      onClick={() => (isEditingDispatch ? setEditingDispatchId(null) : startEditDispatch(order))}
                    >
                      {isEditingDispatch ? 'Cancel Edit' : 'Edit Courier / Rider'}
                    </button>
                  </div>

                  {!isEditingDispatch ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem' }}>
                      <div>Courier: <strong>{order.dispatchInfo?.courierName || 'Roshan Express Local'}</strong></div>
                      <div>Tracking No: <strong>{order.dispatchInfo?.trackingNumber || order.id}</strong></div>
                      <div>Rider: <strong>{order.dispatchInfo?.riderName || 'Roshan Delivery Associate'}</strong></div>
                      <div>Contact: <strong>{order.dispatchInfo?.riderContact || '+91 7004634675'}</strong></div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Courier Name"
                        value={dispatchForm.courierName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, courierName: e.target.value })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        value={dispatchForm.trackingNumber}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        placeholder="Rider Name"
                        value={dispatchForm.riderName}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, riderName: e.target.value })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="text"
                        placeholder="Rider Contact Phone"
                        value={dispatchForm.riderContact}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, riderContact: e.target.value })}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ gridColumn: 'span 2', padding: '0.4rem', fontSize: '0.82rem' }}
                        onClick={() => saveDispatchInfo(order.id)}
                      >
                        Save Dispatch Details
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Transitions & Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quick Status:</span>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 9px', fontSize: '0.78rem', borderRadius: '6px', background: '#e2e8f0', color: '#1e293b' }}
                      onClick={() => handleQuickTransition(order, 'CONFIRMED', 'Order confirmed by administrator.', 'Roshan Fulfillment Hub')}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 9px', fontSize: '0.78rem', borderRadius: '6px', background: '#f3e8ff', color: '#7e22ce' }}
                      onClick={() => handleQuickTransition(order, 'PACKED', 'Items packed and sealed in warehouse.', 'Satyam Nagar Warehouse')}
                    >
                      Pack
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 9px', fontSize: '0.78rem', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1' }}
                      onClick={() => handleQuickTransition(order, 'DISPATCHED', 'Package dispatched with local delivery associate.', 'Dhanbad Logistics Hub')}
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 9px', fontSize: '0.78rem', borderRadius: '6px', background: '#ffedd5', color: '#c2410c' }}
                      onClick={() => handleQuickTransition(order, 'OUT_FOR_DELIVERY', 'Out for delivery to customer destination.', 'Dhanbad Delivery Van')}
                    >
                      Out for Delivery
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 9px', fontSize: '0.78rem', borderRadius: '6px', background: '#dcfce7', color: '#15803d' }}
                      onClick={() => handleQuickTransition(order, 'DELIVERED', 'Package handed over and delivered successfully.', 'Customer Doorstep')}
                    >
                      Deliver
                    </button>
                  </div>

                  {/* Manual Dropdown Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <select
                      value={order.status || 'ORDER_PLACED'}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="ORDER_PLACED">Order Placed</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PACKED">Packed</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
