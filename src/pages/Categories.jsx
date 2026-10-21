import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import useProducts from '../hooks/useProducts';
import useDebounce from '../hooks/useDebounce';
import SEO from '../components/SEO';
import { Search, SlidersHorizontal } from 'lucide-react';
import './Categories.css';

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  const activeCategory = searchParams.get('cat') || 'all';
  const initialSort = searchParams.get('sort') || 'featured';
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [sortBy, setSortBy] = useState(initialSort);
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  const { products, categories, isLoading } = useProducts();

  // Sync debounced search to URL query
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearchTerm) {
        next.set('q', debouncedSearchTerm);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  }, [debouncedSearchTerm, setSearchParams]);

  // Sync sort to URL query
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSort && newSort !== 'featured') {
        next.set('sort', newSort);
      } else {
        next.delete('sort');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Declaratively derive selected product from state or route param
  const selectedProduct = useMemo(() => {
    if (activeModalProduct) return activeModalProduct;
    if (params.id && products.length > 0) {
      return products.find((p) => String(p.id) === String(params.id)) || null;
    }
    return null;
  }, [activeModalProduct, params.id, products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return products;
    }
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory, products]);

  const visibleProducts = useMemo(() => {
    const queryStr = debouncedSearchTerm.trim().toLowerCase();
    let next = filteredProducts.filter((product) => {
      if (!queryStr) return true;
      const text = `${product.name} ${product.description || ''} ${product.category || ''} ${product.brand || ''}`.toLowerCase();
      return text.includes(queryStr);
    });

    if (sortBy === 'price-low') {
      next = [...next].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      next = [...next].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name') {
      next = [...next].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      next = [...next].sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0));
    }

    return next;
  }, [filteredProducts, debouncedSearchTerm, sortBy]);

  const handleCategoryClick = useCallback((catId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (catId === 'all') {
        next.delete('cat');
      } else {
        next.set('cat', catId);
      }
      return next;
    });
  }, [setSearchParams]);

  const handleOpenProductModal = useCallback((product) => {
    setActiveModalProduct(product);
  }, []);

  const handleCloseProductModal = useCallback(() => {
    setActiveModalProduct(null);
    if (params.id) {
      navigate('/categories', { replace: true });
    }
  }, [navigate, params.id]);

  const activeCategoryLabel = activeCategory === 'all' ? 'All Collections' : categories.find((c) => c.id === activeCategory)?.name || activeCategory;

  return (
    <div className="categories-container animate-fade-in">
      <SEO
        title={`${activeCategoryLabel} | Roshan Enterprises Dhanbad`}
        description={`Shop ${activeCategoryLabel} online at Roshan Enterprises. Find high quality mustard oil, sunflower oil, Assam tea, and household supplies in Dhanbad.`}
        canonicalPath={`/categories${activeCategory !== 'all' ? `?cat=${activeCategory}` : ''}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Collections', url: '/categories' },
          ...(activeCategory !== 'all' ? [{ name: activeCategoryLabel, url: `/categories?cat=${activeCategory}` }] : [])
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          'name': `${activeCategoryLabel} - Roshan Enterprises`,
          'description': `Browse our collection of ${activeCategoryLabel} at wholesale and retail prices in Dhanbad, Jharkhand.`,
          'url': `https://e-commerce-roshan-enterprises-dhn.web.app/categories${activeCategory !== 'all' ? `?cat=${activeCategory}` : ''}`
        }}
      />

      {/* Page Header */}
      <div className="categories-header">
        <div className="categories-header-badge">
          <span className="live-dot" /> Dhanbad Wholesale & Retail Catalog
        </div>
        <h1 className="categories-main-title">Our Premium Collections</h1>
        <p className="categories-subtitle">
          Explore pure cooking oils, authentic Assam tea, and household essentials available at direct mill wholesale rates.
        </p>

        {/* Quick Modern Category Filter Pills */}
        <div className="categories-quick-pills" role="tablist" aria-label="Product categories">
          <button
            type="button"
            className={`quick-pill ${activeCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => handleCategoryClick('all')}
          >
            <span>✨</span> All Products
          </button>
          {categories.map((cat) => {
            const icon = cat.id.includes('oil') ? '🛢️' : cat.id.includes('tea') ? '🍃' : cat.id.includes('detergent') ? '🧼' : cat.id.includes('agarbatti') ? '🪔' : '📦';
            return (
              <button
                key={cat.id}
                type="button"
                className={`quick-pill ${activeCategory === cat.id ? 'is-active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span>{icon}</span> {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="categories-layout">
        {/* Sidebar Filters */}
        <aside className="categories-sidebar">
          <div className="sidebar-header">
            <SlidersHorizontal size={18} />
            <h3 className="sidebar-title">Categories</h3>
          </div>
          <ul className="category-list">
            <li>
              <button
                type="button"
                className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('all')}
              >
                <span>✨</span> All Products
              </button>
            </li>
            {categories.map((cat) => {
              const icon = cat.id.includes('oil') ? '🛢️' : cat.id.includes('tea') ? '🍃' : cat.id.includes('detergent') ? '🧼' : cat.id.includes('agarbatti') ? '🪔' : '📦';
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span>{icon}</span> {cat.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main Products Container */}
        <main className="categories-main">
          <div className="categories-results-bar">
            <span className="results-count">
              Showing <strong>{visibleProducts.length}</strong> products
            </span>
            <div className="categories-controls">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="search"
                  className="input categories-search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <select
                className="input categories-sort"
                value={sortBy}
                onChange={(event) => handleSortChange(event.target.value)}
                aria-label="Sort products by"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="categories-products-grid">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="product-card" style={{ padding: '1rem', minHeight: '320px' }}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ width: '80%', height: '20px', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ width: '50%', height: '24px', marginTop: 'auto' }} />
                </div>
              ))}
            </div>
          ) : visibleProducts.length > 0 ? (
            <div className="categories-products-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleOpenProductModal}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state glass-panel">
              <h3>No products found</h3>
              <p className="text-muted">
                Try adjusting your search terms or filter criteria to find what you are looking for.
              </p>
              <button
                type="button"
                className="btn btn-secondary mt-4"
                onClick={() => {
                  setSearchTerm('');
                  handleCategoryClick('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Intercepting Modal Route for Product Quick-View */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={handleCloseProductModal}
      />
    </div>
  );
};

export default React.memo(Categories);
