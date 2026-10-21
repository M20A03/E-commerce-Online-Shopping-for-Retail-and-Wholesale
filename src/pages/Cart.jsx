import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Tag, TrendingDown } from 'lucide-react';
import { useCart, calculateTieredPrice } from '../context/CartContext';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getWholesaleSavings } = useCart();
  const navigate = useNavigate();

  const subtotal = Number(getCartTotal().toFixed(2));
  const wholesaleSavings = Number(getWholesaleSavings().toFixed(2));
  const shippingFee = subtotal >= 500 ? 0 : 49;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const finalTotal = Number((subtotal + shippingFee + tax).toFixed(2));

  if (cart.length === 0) {
    return (
      <div className="container section flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
          <ShoppingBag size={48} />
        </div>
        <h2 className="heading-2 mb-2">Your cart is empty</h2>
        <p className="text-muted mb-6" style={{ maxWidth: '400px' }}>
          Looks like you have not added any daily essentials or grocery items to your cart yet.
        </p>
        <Link to="/categories" className="btn btn-primary btn-lg">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
        <h1 className="heading-1" style={{ margin: 0 }}>Shopping Cart</h1>
        <span className="text-muted text-sm">Retail & Wholesale Orders Dispatched Daily in Dhanbad</span>
      </div>

      <div className="cart-layout">
        <div className="cart-items-container">
          <div className="cart-card">
            {/* Desktop Header */}
            <div className="cart-header">
              <div className="col-product">Product</div>
              <div className="col-price">Unit Price</div>
              <div className="col-qty">Quantity</div>
              <div className="col-total">Subtotal</div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items">
              {cart.map((item) => {
                const tiered = calculateTieredPrice(item.price, item.quantity);
                const hasWholesaleDiscount = tiered.discountPercent > 0;

                return (
                  <div key={item.id} className="cart-item">
                    <div className="col-product flex gap-3 items-center">
                      <img
                        src={optimizeImageUrl(item.image || item.images, 160)}
                        alt={item.name}
                        className="cart-item-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/products/t1.jpg')}
                      />
                      <div>
                        <h4 className="cart-item-name">
                          <Link to={`/categories?cat=${item.category || 'all'}`}>
                            {(item.name || '').replace(/_/g, ' ')}
                          </Link>
                        </h4>
                        {hasWholesaleDiscount ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(249, 115, 22, 0.12)', border: '1px solid var(--brand-wholesale)', color: 'var(--brand-wholesale)', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', margin: '4px 0' }}>
                            <Tag size={12} /> {tiered.tierName} ({tiered.discountPercent}% OFF)
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', margin: '2px 0' }}>
                            Add {10 - item.quantity} more for Wholesale Tier 1 (6% off)
                          </span>
                        )}
                        <div>
                          <button
                            type="button"
                            className="cart-item-remove"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-price">
                      <span className="mobile-label">Unit Price:</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="price-val">₹{tiered.unitPrice.toFixed(2)}</span>
                        {hasWholesaleDiscount && (
                          <span style={{ textDecoration: 'line-through', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-qty">
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="col-total">
                      <span className="mobile-label">Subtotal:</span>
                      <span className="total-val">₹{tiered.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="cart-summary-container">
          <div className="cart-summary">
            <h3 className="heading-3 mb-4 border-bottom">Order Summary</h3>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {wholesaleSavings > 0 && (
                <div className="summary-row" style={{ color: 'var(--brand-wholesale)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingDown size={14} /> Bulk Wholesale Savings
                  </span>
                  <strong>-₹{wholesaleSavings.toFixed(2)}</strong>
                </div>
              )}

              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? <strong className="text-success">FREE</strong> : `₹${shippingFee.toFixed(2)}`}</span>
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

            {shippingFee > 0 && (
              <p className="free-shipping-hint">
                Add <strong>₹{(500 - subtotal).toFixed(2)}</strong> more to get <strong>FREE Local Delivery</strong>!
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary w-full btn-lg mt-4"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Cart);
