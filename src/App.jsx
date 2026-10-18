import React, { lazy, Suspense, useCallback, useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Global Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, useTheme } from './components/ThemeProvider';

// Layout & Core Infrastructure Components
import ErrorBoundary from './components/ErrorBoundary';
import GlassNavbar from './components/GlassNavbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CartDrawer from './components/CartDrawer';
import ToastContainer from './components/ToastContainer';
import CookieConsent from './components/CookieConsent';
import BrandLoader from './components/BrandLoader';
import WelcomeSplash from './components/WelcomeSplash';

// Global Scroll Observer for smooth reveals
function GlobalScrollObserver() {
  const { pathname } = useLocation();

  useEffect(() => {
    const revealSelector = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

    const revealElementsInViewport = () => {
      const elements = document.querySelectorAll(revealSelector);
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 1.15 || !window.IntersectionObserver) {
          el.classList.add('visible');
        }
      });
    };

    revealElementsInViewport();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '50px 0px 50px 0px' }
    );

    const observeAll = () => {
      document.querySelectorAll(revealSelector).forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    };

    observeAll();

    const mutationObserver = new MutationObserver(() => {
      revealElementsInViewport();
      observeAll();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const safetyTimer = setTimeout(() => {
      document.querySelectorAll(revealSelector).forEach((el) => {
        el.classList.add('visible');
      });
    }, 400);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

// Lazy-loaded pages with Suspense chunks
const Homepage = lazy(() => import('./pages/Homepage'));
const Categories = lazy(() => import('./pages/Categories'));
const Account = lazy(() => import('./pages/Account'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const About = lazy(() => import('./pages/About'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));

const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartButtonRef = useRef(null);
  const location = useLocation();

  const handleOpenCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  return (
    <div className="app-container">
      <WelcomeSplash />
      <div className="ambient-glow" aria-hidden="true" />
      <GlobalScrollObserver />
      <ScrollToTop />

      <GlassNavbar
        theme={theme}
        toggleTheme={toggleTheme}
        onCartClick={handleOpenCart}
        cartButtonRef={(node) => {
          cartButtonRef.current = node;
        }}
      />

      <main className="main-content">
        <Suspense
          fallback={<BrandLoader message="Loading Roshan Enterprises..." />}
        >
          <Routes location={location}>
            <Route
              path="/"
              element={<Homepage onOpenCart={handleOpenCart} cartButtonRef={cartButtonRef} />}
            />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Categories />} />
            <Route path="/products/:id" element={<Categories />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="*" element={<Categories />} />
          </Routes>
        </Suspense>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={handleCloseCart} />
      <Footer />
      <ToastContainer />
      <CookieConsent />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ThemeProvider>
                <Router>
                  <AppContent />
                </Router>
              </ThemeProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
