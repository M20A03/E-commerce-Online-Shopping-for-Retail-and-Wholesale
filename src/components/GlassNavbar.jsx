// IMPROVEMENT: Memoized GlassNavbar with SVG Logo component, memoized action handlers, and Admin Portal navigation
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, ChevronRight, Home, LogOut, Moon, ShoppingCart, Sun, User, X, Search, Menu, Heart, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Logo from './Logo';
import './GlassNavbar.css';

const MagneticButton = React.memo(({ children, className = '', onClick, ariaLabel, buttonRef }) => {
  const innerRef = useRef(null);
  const setRefs = useCallback((node) => {
    innerRef.current = node;
    if (typeof buttonRef === 'function') {
      buttonRef(node);
    }
  }, [buttonRef]);

  const handleMove = useCallback((event) => {
    const node = innerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = event.clientX - centerX;
    const distanceY = event.clientY - centerY;
    const distance = Math.min(20, Math.sqrt(distanceX * distanceX + distanceY * distanceY));
    if (distance >= 20) {
      node.style.transform = 'translate3d(0, 0, 0)';
      return;
    }
    const ratio = (20 - distance) / 20;
    node.style.transform = `translate3d(${distanceX * 0.18 * ratio}px, ${distanceY * 0.18 * ratio}px, 0)`;
  }, []);

  const handleLeave = useCallback(() => {
    if (innerRef.current) {
      innerRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  }, []);

  return (
    <button
      ref={setRefs}
      type="button"
      aria-label={ariaLabel}
      className={`magnetic-button ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

MagneticButton.displayName = 'MagneticButton';

const GlassNavbar = ({ theme, toggleTheme, onCartClick, cartButtonRef }) => {
  const { getCartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const cartCount = getCartCount();
  const currentDomain = typeof window !== 'undefined' ? window.location.host : '';

  const navLinks = useMemo(() => ([
    { to: '/categories', label: 'Categories' },
    { to: '/about', label: 'About' },
    { to: '/orders', label: 'Orders' },
    { to: '/track-order', label: 'Track Order' }
  ]), []);

  const MotionHeader = motion.header;
  const MotionDiv = motion.div;

  useEffect(() => {
    setMobileOpen(false);
    setAuthOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (authOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [authOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setAuthOpen(false);
        navigate('/');
      } else {
        setAuthError(result.error || 'Unable to continue with Google');
      }
    } finally {
      setAuthLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <>
      <MotionHeader
        className="glass-navbar glass-navbar__shell"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="glass-navbar__inner">
          <Logo size="medium" />

          <nav className="glass-navbar__links" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`glass-navbar__link ${location.pathname === link.to ? 'is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="glass-navbar__actions">
            <MagneticButton
              className="glass-button--soft glass-navbar__icon-button"
              ariaLabel="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </MagneticButton>

            <MagneticButton
              className="glass-button--soft glass-navbar__icon-button glass-navbar__cart"
              ariaLabel="Open cart"
              onClick={onCartClick}
              buttonRef={cartButtonRef}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="glass-navbar__badge">{cartCount}</span>}
            </MagneticButton>

            <MagneticButton
              className="glass-button--soft glass-navbar__icon-button"
              ariaLabel="View wishlist"
              onClick={() => navigate('/wishlist')}
            >
              <Heart size={18} />
              {wishlistItems.length > 0 && <span className="glass-navbar__badge">{wishlistItems.length}</span>}
            </MagneticButton>

            {user ? (
              <>
                <div className="glass-navbar__auth-panel">
                  <button type="button" className="glass-button glass-button--soft" onClick={() => navigate('/account')}>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="glass-navbar__avatar-img"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="glass-navbar__avatar"><User size={16} /></span>
                    )}
                    <span className="glass-navbar__user-copy">
                      <span className="glass-navbar__user-label">Signed in as</span>
                      <span className="glass-navbar__user-name">{user.displayName || user.email}</span>
                    </span>
                  </button>
                </div>
                <MagneticButton
                  className="glass-button--ghost glass-navbar__icon-button"
                  ariaLabel="Logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </MagneticButton>
              </>
            ) : (
              <MagneticButton
                className="glass-button--soft glass-navbar__icon-button"
                ariaLabel="Sign in with Google"
                onClick={() => setAuthOpen(true)}
              >
                <User size={17} />
              </MagneticButton>
            )}

            <MagneticButton
              className="glass-button--soft glass-navbar__icon-button glass-navbar__menu-button"
              ariaLabel="Open menu"
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? (
                <X size={18} />
              ) : (
                <span className="glass-navbar__menu-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </MagneticButton>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <MotionDiv
              className="glass-navbar__mobile-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              <div className="glass-navbar__mobile-stack">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="glass-button glass-button--soft glass-navbar__mobile-link">
                    {link.label}
                    <ChevronRight size={16} />
                  </Link>
                ))}
                <button type="button" className="glass-button glass-button--soft glass-navbar__mobile-action" onClick={onCartClick}>
                  <ShoppingCart size={16} />
                  Cart {cartCount > 0 ? `(${cartCount})` : ''}
                </button>
                <button type="button" className="glass-button glass-button--soft glass-navbar__mobile-action" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  Toggle theme
                </button>
                <Link to="/account" className="glass-button glass-button--soft glass-navbar__mobile-action" onClick={() => setMobileOpen(false)}>
                  <User size={16} />
                  My Account
                </Link>
                {user ? (
                  <button type="button" className="glass-button glass-button--soft glass-navbar__mobile-action" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                ) : (
                  <button
                    type="button"
                    className="glass-button glass-button--soft glass-navbar__mobile-action"
                    onClick={() => setAuthOpen(true)}
                  >
                    <Monitor size={16} />
                    Sign in with Google
                  </button>
                )}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionHeader>

      {/* ── Google Sign-In Modal ── */}
      <AnimatePresence>
        {authOpen && (
          <MotionDiv
            className="glass-navbar__modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setAuthOpen(false)}
          >
            <MotionDiv
              className="glass-navbar__modal glass-modal"
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="glass-navbar__modal-top">
                <div>
                  <h2 className="glass-navbar__modal-title">Welcome to Roshan Enterprises</h2>
                  <p className="glass-navbar__modal-copy">
                    Sign in with your Google account to track orders and manage your cart across devices.
                  </p>
                </div>
                <MagneticButton className="glass-button--soft glass-navbar__icon-button" ariaLabel="Close dialog" onClick={() => setAuthOpen(false)}>
                  <X size={18} />
                </MagneticButton>
              </div>

              {authError && (
                <div className="glass-navbar__error">
                  {authError}
                  {authError.includes('unauthorized-domain') && (
                    <p className="glass-navbar__hint" style={{ marginTop: '0.4rem' }}>
                      Add <strong>{currentDomain}</strong> in Firebase Authentication → Authorized domains.
                    </p>
                  )}
                </div>
              )}

              <div className="glass-navbar__google-cta">
                <button
                  id="google-signin-btn"
                  type="button"
                  className="glass-button glass-button--google"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                >
                  <Monitor size={20} />
                  {authLoading ? 'Signing in…' : 'Continue with Google'}
                </button>

                <p className="glass-navbar__hint">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" onClick={() => setAuthOpen(false)}>Terms</Link> and{' '}
                  <Link to="/privacy" onClick={() => setAuthOpen(false)}>Privacy Policy</Link>.
                </p>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
      {/* ── Mobile Bottom Navigation ── */}
      <nav className="glass-navbar__bottom-nav" aria-label="Mobile Bottom Navigation">
        <Link to="/" className={`glass-navbar__bottom-nav-item ${location.pathname === '/' ? 'is-active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </Link>
        <Link to="/categories" className={`glass-navbar__bottom-nav-item ${location.pathname === '/categories' ? 'is-active' : ''}`}>
          <Search size={22} />
          <span>Shop</span>
        </Link>
        <button type="button" className="glass-navbar__bottom-nav-item" onClick={onCartClick}>
          <div className="glass-navbar__bottom-nav-icon-wrap">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="glass-navbar__badge glass-navbar__badge--bottom">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </button>
        <Link to="/account" className={`glass-navbar__bottom-nav-item ${location.pathname === '/account' ? 'is-active' : ''}`}>
          <User size={22} />
          <span>Account</span>
        </Link>
        <button type="button" className={`glass-navbar__bottom-nav-item ${mobileOpen ? 'is-active' : ''}`} onClick={() => setMobileOpen((value) => !value)}>
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
};

export default React.memo(GlassNavbar);
