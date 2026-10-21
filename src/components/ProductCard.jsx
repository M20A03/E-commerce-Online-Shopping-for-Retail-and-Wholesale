import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Check, Heart, Star, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useReveal } from '../hooks/useReveal';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './ProductCard.css';

export function cleanProductName(name) {
  if (!name) return 'Product';
  return name
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ProductCard({ product, delay = 0, onQuickView }) {
  const { cart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const revealRef = useReveal();
  const cardRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const isWishlisted = isInWishlist(product.id);
  const ratingVal = Number(product.rating) || 4.8;
  const rawReviews = Number(product.reviews) || 0;
  const displayReviews = rawReviews > 0 ? `${rawReviews} reviews` : 'Verified Buyer Rating';

  const cartItem = cart?.find((item) => item.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const displayName = cleanProductName(product.name);
  const basePrice = Number(product.price) || 0;
  const originalPrice = product.originalPrice && Number(product.originalPrice) > basePrice
    ? Number(product.originalPrice)
    : Math.round(basePrice * 1.15);
  const discountPercent = Math.max(5, Math.round((1 - basePrice / originalPrice) * 100));

  // Dynamic modern category badge
  const badgeLabel = product.badge || (
    basePrice >= 1200 ? 'Wholesale Tier' :
    product.category === 'oil' ? 'Agmark Certified' :
    product.category === 'tea' ? 'Assam Estate' :
    product.category === 'detergent' ? 'Bulk Savings' :
    'Top Quality'
  );

  const handleCardClick = useCallback(() => {
    if (typeof onQuickView === 'function') {
      onQuickView(product);
    } else {
      navigate(`/categories?cat=${product.category || 'all'}`);
    }
  }, [navigate, onQuickView, product]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    addToCart(product, 1);
  }, [addToCart, product]);

  const handleToggleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [toggleWishlist, product]);

  return (
    <div
      ref={(el) => {
        revealRef.current = el;
        cardRef.current = el;
      }}
      className="modern-product-card reveal"
      style={{
        transitionDelay: `${delay}s`,
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      }}
      onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
      onMouseMove={handleMouseMove}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View details for ${displayName}`}
    >
      {/* Visual Image & Badge Container */}
      <div className="modern-card-visual">
        <span className="modern-card-badge">
          <Sparkles size={11} className="badge-sparkle" /> {badgeLabel}
        </span>

        <button
          type="button"
          className={`modern-card-wishlist ${isWishlisted ? 'is-wishlisted' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="modern-img-frame">
          <img
            src={optimizeImageUrl(product.image || product.images, 420)}
            alt={displayName}
            loading="lazy"
            decoding="async"
            onError={(e) => handleImageError(e, '/products/t1.jpg')}
          />
        </div>

        {discountPercent > 0 && (
          <span className="modern-discount-chip">
            SAVE {discountPercent}%
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="modern-card-body">
        <div className="modern-card-meta">
          <span className="modern-card-brand">{product.brand || 'Roshan Enterprises'}</span>
          <div className="modern-card-rating" title={`${ratingVal} out of 5 stars`}>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span className="rating-num">{ratingVal.toFixed(1)}</span>
            <span className="rating-count">({displayReviews})</span>
          </div>
        </div>

        <h3 className="modern-card-title" title={displayName}>
          {displayName}
        </h3>

        {/* Pricing Row */}
        <div className="modern-card-pricing-row">
          <div className="modern-price-group">
            <span className="modern-current-price">₹{basePrice.toLocaleString('en-IN')}</span>
            {originalPrice > basePrice && (
              <span className="modern-mrp-price">₹{originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>

          {/* Action Button */}
          <button
            type="button"
            className={`modern-add-button ${quantityInCart > 0 ? 'is-added' : ''}`}
            onClick={handleAddToCart}
            aria-label={`Add ${displayName} to shopping cart`}
          >
            {quantityInCart > 0 ? (
              <>
                <Check size={14} /> In Cart ({quantityInCart})
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
