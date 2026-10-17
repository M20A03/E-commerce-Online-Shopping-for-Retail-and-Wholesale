import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  const subtotal = Number(getCartTotal().toFixed(2));
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
      <h1 className="heading-1 mb-6">Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items-container">
          <div className="cart-card">
            {/* Desktop Header */}
            <div className="cart-header">
              <div className="col-product">Product</div>
              <div className="col-price">Price</div>
              <div className="col-qty">Quantity</div>
              <div className="col-total">Total</div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="col-product flex gap-3 items-center">
                    <img
                      src={optimizeImageUrl(item.image, 160)}
                      alt={item.name}
                      className="cart-item-img"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, '/products/t1.jpg')}
                    />
                    <div>
                      <h4 className="cart-item-name">
                        <Link to={`/categories?cat=${item.category || 'all'}`}>{item.name}</Link>
                      </h4>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="col-price">
                    <span className="mobile-label">Unit Price:</span>
                    <span className="price-val">₹{Number(item.price).toFixed(2)}</span>
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
                    <span className="total-val">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
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
