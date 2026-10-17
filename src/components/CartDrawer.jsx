// IMPROVEMENT: Memoized CartDrawer with free shipping progress threshold, animated items, and checkout redirection
import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Truck, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './CartDrawer.css';

const MotionDiv = motion.div;
const FREE_SHIPPING_THRESHOLD = 500;

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const total = getCartTotal();
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCheckoutClick = useCallback(() => {
    onClose();
    if (!user) {
      if (addToast) addToast('Please sign in or create an account to proceed with checkout.', 'info');
      navigate('/account', { state: { from: '/checkout', prompt: 'Sign in to complete your checkout.' } });
      return;
    }
    navigate('/checkout');
  }, [user, onClose, navigate, addToast]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="cart-drawer glass-drawer" role="dialog" aria-label="Shopping Cart Drawer">
        <header className="cart-drawer__header">
          <div>
            <h2 className="cart-drawer__title">Your Shopping Cart</h2>
            <p className="cart-drawer__subtitle">{cart.length} item{cart.length === 1 ? '' : 's'}</p>
          </div>
          <button type="button" className="cart-drawer__close-btn" onClick={onClose} aria-label="Close cart drawer">
            <X size={20} />
          </button>
        </header>

        {/* Free Shipping Progress Indicator */}
        <div className="cart-drawer__shipping-bar">
          <div className="cart-drawer__shipping-text">
            <Truck size={16} />
            {amountToFreeShipping > 0 ? (
              <span>Add <strong>₹{amountToFreeShipping.toFixed(2)}</strong> more for <strong>FREE Shipping</strong>!</span>
            ) : (
              <span className="text-success">You qualify for <strong>FREE Shipping</strong>! 🎉</span>
            )}
          </div>
          <div className="cart-drawer__progress-track">
            <div className="cart-drawer__progress-fill" style={{ width: `${shippingProgress}%` }} />
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-icon">
              <ShoppingBag size={48} />
            </div>
            <div>
              <h3 className="section-title" style={{ fontSize: '1.4rem' }}>Your cart is empty</h3>
              <p className="section-subtitle" style={{ marginTop: '0.4rem' }}>
                Discover our premium collection of cooking oils, teas, and household essentials.
              </p>
            </div>
            <Link to="/categories" className="glass-button glass-button--primary" onClick={onClose}>
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="cart-drawer__items">
            {cart.map((item, index) => (
              <MotionDiv
                key={item.id}
                className="cart-drawer__item"
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 + 0.05, duration: 0.25 }}
              >
                <img
                  src={optimizeImageUrl(Array.isArray(item.images) && item.images.length ? item.images[0] : item.image, 160)}
                  alt={item.name}
                  className="cart-drawer__thumb"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => handleImageError(e, '/products/t1.jpg')}
                />
                <div className="cart-drawer__item-body">
                  <div className="cart-drawer__item-top">
                    <div>
                      <h3 className="cart-drawer__item-title">{item.name}</h3>
                      <p className="cart-drawer__item-price">₹{Number(item.price).toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      className="cart-drawer__remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="cart-drawer__controls">
                    <div className="cart-drawer__stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong>₹{(Number(item.price) * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <footer className="cart-drawer__summary">
            <div className="cart-drawer__summary-row">
              <span className="cart-drawer__summary-label">Subtotal</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
            <div className="cart-drawer__summary-row">
              <span className="cart-drawer__summary-label">Estimated Delivery</span>
              <strong>{amountToFreeShipping === 0 ? 'FREE' : '₹49.00'}</strong>
            </div>
            <div className="cart-drawer__summary-row">
              <span className="cart-drawer__summary-label">Total Amount</span>
              <strong className="cart-drawer__summary-total">₹{(total + (amountToFreeShipping === 0 ? 0 : 49)).toFixed(2)}</strong>
            </div>
            <div className="cart-drawer__actions">
              <Link to="/cart" className="glass-button glass-button--soft" onClick={onClose}>
                View Full Cart
              </Link>
              <button
                type="button"
                className="glass-button glass-button--primary"
                onClick={handleCheckoutClick}
              >
                Checkout <ArrowRight size={16} />
              </button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
};

export default React.memo(CartDrawer);
