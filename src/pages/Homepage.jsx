import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useProducts from '../hooks/useProducts';
import SEO from '../components/SEO';
import { optimizeImageUrl, handleImageError, FALLBACK_PRODUCT_IMAGE } from '../utils/imageOptimizer';
import './Homepage.css';

const slides = [
  {
    title: 'Premium Mustard & Refined Oils',
    text: '100% pure double-refined cooking oils and kachi ghani mustard oil for healthy, authentic everyday meals.',
    metric: 'Guaranteed Purity & Quality',
    image: 'https://res.cloudinary.com/dbtilvzbi/image/upload/v1778042502/Fortune_1Litre_Palm_Pouch_mb49mb.jpg',
    fallback: '/products/o1.jpg',
  },
  {
    title: 'Authentic Assam & Darjeeling Teas',
    text: 'Handpicked fresh tea leaves with rich aroma and robust flavor, sourced directly from certified tea estates.',
    metric: 'Fresh Batch Guarantee',
    image: 'https://res.cloudinary.com/dbtilvzbi/image/upload/v1778042491/Elachi_Tea_1Kg_Box_irolbo.jpg',
    fallback: '/products/t1.jpg',
  },
  {
    title: 'Household & Cleaning Supplies',
    text: 'Top-grade laundry detergents, dishwashing bars, and hygiene essentials available at direct wholesale rates.',
    metric: 'Wholesale Bulk Savings',
    image: 'https://res.cloudinary.com/dbtilvzbi/image/upload/v1778042482/Doctor_5Kg_Detergent_bvdxc8.jpg',
    fallback: '/products/d2.jpg',
  },
];

const flow = [
  {
    step: '01',
    name: 'Browse Catalog',
    desc: 'Explore our vast collection of retail & wholesale household essentials.',
  },
  {
    step: '02',
    name: 'Choose Quantity',
    desc: 'Select individual consumer packs or cost-effective bulk wholesale packages.',
  },
  {
    step: '03',
    name: 'Fast Checkout',
    desc: 'Pay securely online via UPI QR code, Cards, or Cash on Delivery.',
  },
  {
    step: '04',
    name: 'Doorstep Delivery',
    desc: 'Receive reliable, prompt doorstep delivery anywhere across Dhanbad.',
  },
];

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const value = Math.min(Math.max((window.scrollY / total) * 100, 0), 100);
      setProgress(value);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

export default function Home() {
  const { products } = useProducts();
  const [active, setActive] = useState(0);
  const [isShowcasePaused, setIsShowcasePaused] = useState(false);
  const [productCarouselStart, setProductCarouselStart] = useState(0);
  const [ripples, setRipples] = useState([]);
  const heroRef = useRef(null);
  const heroRafRef = useRef(null);
  const rippleTimeoutsRef = useRef([]);

  const [recentlyViewedIds] = useState(() => {
    const parsed = JSON.parse(window.localStorage.getItem('lumi-recently-viewed') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  });

  const progress = useScrollProgress();
  const currentSlide = useMemo(() => slides[active], [active]);
  const weeklyDiscountProducts = useMemo(() => products.filter((product) => product.originalPrice || product.discount).slice(0, 4), [products]);
  const carouselProducts = useMemo(() => products.slice(0, 10), [products]);
  const visibleCarouselProducts = useMemo(
    () => carouselProducts.slice(productCarouselStart, productCarouselStart + 4),
    [carouselProducts, productCarouselStart]
  );
  const recentlyViewedProducts = useMemo(
    () => recentlyViewedIds.map((id) => products.find((item) => item.id === id)).filter(Boolean).slice(0, 4),
    [recentlyViewedIds, products]
  );

  useEffect(() => {
    if (isShowcasePaused) return undefined;

    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isShowcasePaused]);

  const maxCarouselStart = Math.max(0, carouselProducts.length - 4);
  const nextCarousel = () => {
    setProductCarouselStart((prev) => (prev >= maxCarouselStart ? 0 : prev + 1));
  };
  const prevCarousel = () => {
    setProductCarouselStart((prev) => (prev <= 0 ? maxCarouselStart : prev - 1));
  };

  const onShowcaseTabKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive((index + 1) % slides.length);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive((index - 1 + slides.length) % slides.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActive(slides.length - 1);
    }
  };

  const setHeroTilt = (x, y) => {
    const el = heroRef.current;
    if (!el) return;
    const hue = Math.round(22 + (x / 100) * 195);
    el.style.setProperty('--mx', String(x));
    el.style.setProperty('--my', String(y));
    el.style.setProperty('--mh', String(hue));
  };

  const handleHeroMove = (event) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (heroRafRef.current) window.cancelAnimationFrame(heroRafRef.current);
    heroRafRef.current = window.requestAnimationFrame(() => setHeroTilt(x, y));
  };

  const handleHeroLeave = () => {
    if (heroRafRef.current) window.cancelAnimationFrame(heroRafRef.current);
    setHeroTilt(50, 50);
  };

  const handleHeroClick = (event) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const hue = Math.round(22 + (x / 100) * 195);
    const alpha = (0.48 + ((100 - y) / 100) * 0.26).toFixed(2);
    const burst = [0, 120, 240];

    burst.forEach((delay, index) => {
      const id = Date.now() + Math.random() + index;
      const scale = 1 + index * 0.26;

      setRipples((prev) => [...prev, { id, x, y, delay, scale, hue, alpha }]);

      const timeoutId = window.setTimeout(() => {
        setRipples((prev) => prev.filter((item) => item.id !== id));
      }, 1220 + delay);

      rippleTimeoutsRef.current.push(timeoutId);
    });
  };

  useEffect(() => {
    const timeoutIds = rippleTimeoutsRef.current;
    return () => {
      if (heroRafRef.current) window.cancelAnimationFrame(heroRafRef.current);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  return (
    <div className="dh-home-v2" style={{ '--scroll-depth': progress }}>
      <SEO
        title="Roshan Enterprises | Online Shopping Dhanbad | Retail & Wholesale"
        description="Buy cooking oils, Assam tea, laundry detergent, and daily household essentials online in Dhanbad at wholesale rates with fast doorstep delivery."
        canonicalPath="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'GroceryStore',
          name: 'Roshan Enterprises',
          image: 'https://e-commerce-roshan-enterprises-dhn.web.app/logo.webp',
          url: 'https://e-commerce-roshan-enterprises-dhn.web.app/',
          telephone: '+917004634675',
          priceRange: '₹₹',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'RCVG+6G, Satyam Nagar',
            addressLocality: 'Dhanbad',
            addressRegion: 'Jharkhand',
            postalCode: '826010',
            addressCountry: 'IN'
          },
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '20:00'
          }
        }}
      />
      <div className="dh-scroll-meter" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section
        ref={heroRef}
        className="dhv2-hero"
        onMouseMove={handleHeroMove}
        onMouseLeave={handleHeroLeave}
        onClick={handleHeroClick}
      >
        <div className="dhv2-hero-bg" />
        <div className="dhv2-ambient" aria-hidden="true">
          <span className="dhv2-cursor-field" />

          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="dhv2-ripple"
              style={{
                '--rx': `${ripple.x}%`,
                '--ry': `${ripple.y}%`,
                '--rdelay': `${ripple.delay}ms`,
                '--rscale': ripple.scale,
                '--rh': ripple.hue,
                '--ra': ripple.alpha,
              }}
            />
          ))}

          <span className="dhv2-orb dhv2-orb-a" />
          <span className="dhv2-orb dhv2-orb-b" />
          <span className="dhv2-orb dhv2-orb-c" />

          <span className="dhv2-ring dhv2-ring-a" />
          <span className="dhv2-ring dhv2-ring-b" />
        </div>
        <div className="dhv2-container dhv2-hero-grid">
          <div className="dhv2-copy reveal-left">
            <p className="dhv2-kicker">Roshan Enterprises • Dhanbad, Jharkhand</p>
            <h1>Premium Retail & Wholesale Essentials Delivered to Your Doorstep</h1>
            <p>
              Shop authentic cooking oils, premium Assam tea, dishwashing supplies, and household laundry essentials at unbeatable wholesale prices.
            </p>
            <div className="dhv2-actions">
              <Link to="/categories" className="dhv2-btn dhv2-btn-primary">Explore Products</Link>
              <Link to="/track-order" className="dhv2-btn dhv2-btn-outline">Track Your Order</Link>
            </div>
            <div className="dhv2-pills">
              <span>Direct Wholesale Rates</span>
              <span>100% Quality Guaranteed</span>
              <span>Fast Local Delivery</span>
            </div>
          </div>

          <aside className="dhv2-signal reveal-right">
            <h3>Store Assurance</h3>
            <div className="dhv2-signal-grid">
              <article>
                <strong>15,000+</strong>
                <small>Orders Fulfilled</small>
              </article>
              <article>
                <strong>100%</strong>
                <small>Authentic Products</small>
              </article>
              <article>
                <strong>Same-Day</strong>
                <small>Local Dispatch</small>
              </article>
            </div>
            <p className="dhv2-signal-note">Satyam Nagar, Dhanbad, Jharkhand 826010</p>
          </aside>
        </div>
      </section>

      <section className="dhv2-strip" aria-label="Feature strip">
        <div className="dhv2-strip-track">
          <span>Pure Mustard Oils</span>
          <span>Refined Sunflower Oil</span>
          <span>Assam Fresh Tea</span>
          <span>Laundry Detergents</span>
          <span>Wholesale Grocery Savings</span>
          <span>Fast Dhanbad Delivery</span>
          <span>Pure Mustard Oils</span>
          <span>Refined Sunflower Oil</span>
          <span>Assam Fresh Tea</span>
          <span>Laundry Detergents</span>
          <span>Wholesale Grocery Savings</span>
          <span>Fast Dhanbad Delivery</span>
        </div>
      </section>

      <section className="dhv2-container dhv2-feature-grid reveal">
        <article className="dhv2-feature dhv2-feature-a">
          <h3>Purity & Freshness Guaranteed</h3>
          <p>Sourced straight from certified mills and top brands for maximum safety and nutrition.</p>
        </article>
        <article className="dhv2-feature dhv2-feature-b">
          <h3>Unbeatable Wholesale Savings</h3>
          <p>Special bulk rates for local shops, catering, and smart family monthly shopping.</p>
        </article>
        <article className="dhv2-feature dhv2-feature-c">
          <h3>Prompt Doorstep Delivery</h3>
          <p>Efficient handling and swift local delivery straight to your house or store.</p>
        </article>
      </section>

      <section
        className="dhv2-container dhv2-carousel reveal-scale"
        role="region"
        aria-roledescription="carousel"
        aria-label="Roshan Enterprises Featured Showcase"
        onMouseEnter={() => setIsShowcasePaused(true)}
        onMouseLeave={() => setIsShowcasePaused(false)}
        onFocusCapture={() => setIsShowcasePaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsShowcasePaused(false);
          }
        }}
      >
        <div className="dhv2-carousel-head">
          <p className="dhv2-kicker">Featured Categories</p>
          <h2>Top Quality Everyday Essentials</h2>
          <button
            type="button"
            className="dhv2-carousel-toggle"
            onClick={() => setIsShowcasePaused((prev) => !prev)}
            aria-pressed={isShowcasePaused}
          >
            {isShowcasePaused ? 'Resume Rotation' : 'Pause Rotation'}
          </button>
        </div>

        <div
          className="dhv2-carousel-card"
          id={`showcase-panel-${active}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${active + 1} of ${slides.length}`}
          aria-live={isShowcasePaused ? 'polite' : 'off'}
        >
          <img
            src={optimizeImageUrl(currentSlide.image, 800)}
            alt={currentSlide.title}
            loading="eager"
            decoding="async"
            onError={(e) => handleImageError(e, currentSlide.fallback)}
          />
          <div className="dhv2-carousel-copy">
            <h3>{currentSlide.title}</h3>
            <p>{currentSlide.text}</p>
            <div className="dhv2-badge">{currentSlide.metric}</div>
            <div className="dhv2-dots" role="tablist" aria-label="Showcase slides">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  role="tab"
                  id={`showcase-tab-${index}`}
                  aria-selected={active === index}
                  aria-controls={`showcase-panel-${index}`}
                  tabIndex={active === index ? 0 : -1}
                  className={`dhv2-dot ${active === index ? 'active' : ''}`}
                  aria-label={`Go to ${slide.title}`}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => onShowcaseTabKeyDown(event, index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dhv2-container dhv2-weekly-deals reveal">
        <div className="dhv2-section-head-row">
          <div>
            <p className="dhv2-kicker">Special Offers</p>
            <h2>Weekly Grocery Deals</h2>
          </div>
          <Link to="/categories" className="dhv2-btn dhv2-btn-outline">View All Products</Link>
        </div>
        <div className="products-full-grid dhv2-weekly-grid">
          {weeklyDiscountProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} delay={index * 0.06} />
          ))}
        </div>
      </section>

      <section className="dhv2-container dhv2-product-carousel reveal-scale">
        <div className="dhv2-section-head-row">
          <div>
            <p className="dhv2-kicker">Popular Choice</p>
            <h2>Trending Store Essentials</h2>
          </div>
          <div className="dhv2-carousel-controls">
            <button type="button" onClick={prevCarousel} aria-label="Previous products">←</button>
            <button type="button" onClick={nextCarousel} aria-label="Next products">→</button>
          </div>
        </div>

        <div className="dhv2-product-track">
          {visibleCarouselProducts.map((product) => (
            <Link key={product.id} to={`/categories?cat=${product.category || 'all'}`} className="dhv2-product-slide">
              <img
                src={optimizeImageUrl(product.image, 320)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(e) => handleImageError(e, '/products/t1.jpg')}
              />
              <div>
                <h4>{product.name}</h4>
                <p>{product.brand || 'Roshan Enterprises'}</p>
                <strong>₹{product.price.toFixed(2)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dhv2-journey reveal">
        <div className="dhv2-container">
          <p className="dhv2-kicker">How It Works</p>
          <h2>Simple & Seamless Ordering Process</h2>
          <div className="dhv2-journey-grid">
            {flow.map((item) => (
              <article key={item.step} className="dhv2-journey-card">
                <span>{item.step}</span>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {recentlyViewedProducts.length > 0 && (
        <section className="dhv2-container dhv2-product-carousel reveal-glow">
          <div className="dhv2-section-head-row">
            <div>
              <p className="dhv2-kicker">Continue Shopping</p>
              <h2>Recently Viewed</h2>
            </div>
            <Link to="/categories" className="dhv2-btn dhv2-btn-outline">Browse Catalog</Link>
          </div>
          <div className="dhv2-product-track">
            {recentlyViewedProducts.map((product) => (
              <Link key={product.id} to={`/categories?cat=${product.category || 'all'}`} className="dhv2-product-slide">
                <img
                  src={optimizeImageUrl(product.image, 320)}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => handleImageError(e, '/products/t1.jpg')}
                />
                <div>
                  <h4>{product.name}</h4>
                  <p>{product.brand || 'Roshan Enterprises'}</p>
                  <strong>₹{product.price.toFixed(2)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="dhv2-container dhv2-final reveal">
        <div className="dhv2-final-card">
          <h2>Ready to Order Premium Groceries & Household Essentials?</h2>
          <p>
            Experience pure quality, unbeatable wholesale savings, and direct doorstep delivery from Dhanbad’s most trusted store.
          </p>
          <div className="dhv2-actions">
            <Link to="/categories" className="dhv2-btn dhv2-btn-primary">Shop Now</Link>
            <Link to="/contact" className="dhv2-btn dhv2-btn-outline">Contact Store</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
