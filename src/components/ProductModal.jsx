import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, ShieldCheck, Truck, RefreshCw, Star } from 'lucide-react';
import { useCart, calculateTieredPrice } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { evaluateDeliveryZone } from '../router/guards';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './ProductModal.css';

export function ProductModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('826010');
  const [deliveryInfo, setDeliveryInfo] = useState(() => evaluateDeliveryZone('826010'));

  useEffect(() => {
    setDeliveryInfo(evaluateDeliveryZone(pincode));
  }, [pincode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product, quantity);
  }, [addToCart, product, quantity]);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);
  const ratingVal = Number(product.rating) || 5;
  const reviewsCount = Number(product.reviews) || 120;
  const basePrice = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const tiered = calculateTieredPrice(basePrice, quantity);
  const hasWholesaleDiscount = tiered.discountPercent > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="product-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="product-modal-container glass-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="product-modal-close btn-ghost"
              onClick={onClose}
              aria-label="Close product modal"
            >
              <X size={20} />
            </button>

            <div className="product-modal-grid">
              {/* Product Image Column */}
              <div className="product-modal-media">
                <img
                  src={optimizeImageUrl(product.image || product.images, 600)}
                  alt={product.name}
                  className="product-modal-image"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => handleImageError(e, '/products/t1.jpg')}
                />
                {product.badge && (
                  <span className="product-modal-badge">{product.badge}</span>
                )}
              </div>

              {/* Product Details Column */}
              <div className="product-modal-details">
                <span className="product-modal-brand">{product.brand || 'Roshan Essentials'}</span>
                <h2 className="product-modal-title">{product.name}</h2>

                <div className="product-modal-rating">
                  <div className="flex items-center text-amber-500 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.floor(ratingVal) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-muted text-sm">({reviewsCount} customer reviews)</span>
                </div>

                <div className="product-modal-pricing">
                  <span className="product-modal-price-current">₹{tiered.unitPrice.toFixed(2)}</span>
                  {hasWholesaleDiscount ? (
                    <span className="badge" style={{ backgroundColor: 'var(--brand-wholesale)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                      {tiered.tierName} ({tiered.discountPercent}% OFF)
                    </span>
                  ) : originalPrice > basePrice ? (
                    <>
                      <span className="product-modal-price-original">₹{originalPrice.toFixed(2)}</span>
                      <span className="badge badge-success">
                        Save {Math.round((1 - basePrice / originalPrice) * 100)}%
                      </span>
                    </>
                  ) : null}
                </div>

                {/* Wholesale Bulk Tier Quick Chips */}
                <div style={{ margin: '0.6rem 0', padding: '0.6rem 0.8rem', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-wholesale)', letterSpacing: '0.5px' }}>
                      Wholesale Bulk Savings Tiers
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Total: ₹{tiered.total.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(1)}
                      style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', border: quantity < 10 ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)', background: quantity < 10 ? 'var(--brand-primary-light)' : 'transparent', color: quantity < 10 ? 'var(--brand-primary)' : 'inherit' }}
                    >
                      Retail (1+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(10)}
                      style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', border: quantity >= 10 && quantity < 50 ? '1px solid var(--brand-wholesale)' : '1px solid var(--border-default)', background: quantity >= 10 && quantity < 50 ? 'rgba(249, 115, 22, 0.15)' : 'transparent', color: quantity >= 10 && quantity < 50 ? 'var(--brand-wholesale)' : 'inherit' }}
                    >
                      10+ Units (6% Off)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(50)}
                      style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', border: quantity >= 50 && quantity < 100 ? '1px solid var(--brand-wholesale)' : '1px solid var(--border-default)', background: quantity >= 50 && quantity < 100 ? 'rgba(249, 115, 22, 0.15)' : 'transparent', color: quantity >= 50 && quantity < 100 ? 'var(--brand-wholesale)' : 'inherit' }}
                    >
                      50+ Units (12% Off)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(100)}
                      style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', border: quantity >= 100 ? '1px solid var(--brand-wholesale)' : '1px solid var(--border-default)', background: quantity >= 100 ? 'rgba(249, 115, 22, 0.15)' : 'transparent', color: quantity >= 100 ? 'var(--brand-wholesale)' : 'inherit' }}
                    >
                      100+ Mega Bulk (20% Off)
                    </button>
                  </div>
                </div>

                <p className="product-modal-desc">
                  {product.description ||
                    'High quality, rigorously quality-inspected daily household essentials delivered directly from Roshan Enterprises to your doorstep in Dhanbad.'}
                </p>

                {/* Quantity Selector & Action Buttons */}
                <div className="product-modal-actions">
                  <div className="product-modal-qty">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary product-modal-add-btn"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={18} />
                    Add {quantity > 1 ? `${quantity} items` : ''} to Cart
                  </button>

                  <button
                    type="button"
                    className={`btn btn-secondary product-modal-wish-btn ${
                      isWishlisted ? 'is-active' : ''
                    }`}
                    onClick={() => toggleWishlist(product)}
                    aria-label="Wishlist"
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Delivery Checker */}
                <div className="product-modal-delivery">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-accent" />
                    <span className="text-sm font-semibold">Delivery Availability Check</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input"
                      style={{ maxWidth: '140px' }}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="PIN Code"
                      maxLength={6}
                    />
                    <div className="text-xs text-muted flex items-center">
                      {deliveryInfo.valid ? (
                        <span className="text-success font-medium">
                          {deliveryInfo.label} — {deliveryInfo.deliveryTime}
                        </span>
                      ) : (
                        <span className="text-danger">Enter 6-digit PIN</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="product-modal-trust">
                  <div className="trust-item">
                    <ShieldCheck size={16} />
                    <span>100% Genuine</span>
                  </div>
                  <div className="trust-item">
                    <RefreshCw size={16} />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProductModal;
