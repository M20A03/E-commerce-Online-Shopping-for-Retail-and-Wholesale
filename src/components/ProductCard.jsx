import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useReveal } from '../hooks/useReveal';
import { optimizeImageUrl, handleImageError } from '../utils/imageOptimizer';
import './ProductCard.css';

function ProductCard({ product, delay = 0, onQuickView }) {
  const { addToCart } = useCart();
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
  const ratingVal = Number(product.rating) || 5;
  const reviewsCount = Number(product.reviews) || 0;
  const stars = '★'.repeat(Math.floor(ratingVal)) + (ratingVal % 1 ? '☆' : '');

  const handleCardClick = useCallback(() => {
    if (typeof onQuickView === 'function') {
      onQuickView(product);
    } else {
      navigate(`/categories?cat=${product.category || 'all'}`);
    }
  }, [navigate, onQuickView, product]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    addToCart(product);
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
      className="product-card reveal"
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
      aria-label={`View details for ${product.name}`}
    >
      <div className="product-img-wrap">
        {product.badge && (
          <span className={`product-label ${product.badgeType || 'sale'}`}>{product.badge}</span>
        )}
        <img
          src={optimizeImageUrl(product.image, 380)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => handleImageError(e, '/products/t1.jpg')}
        />
        <button
          type="button"
          className={`product-wishlist ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          type="button"
          className="product-quick-add"
          onClick={handleAddToCart}
        >
          + Add to Cart
        </button>
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand || 'Roshan Essentials'}</p>
        <h4 className="product-name">{product.name}</h4>
        <div className="product-rating">
          <span className="stars">{stars}</span>
          <span>({reviewsCount.toLocaleString()} reviews)</span>
        </div>
        <div className="product-price">
          <span className="price-current">₹{Number(product.price).toFixed(2)}</span>
          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
            <>
              <span className="price-original">₹{Number(product.originalPrice).toFixed(2)}</span>
              <span className="price-badge">
                SAVE {Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
