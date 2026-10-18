import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { HeartCrack, ShoppingCart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './Homepage.css'; // Reusing homepage styles for grids

const Wishlist = () => {
    const { wishlistItems } = useWishlist();

    return (
        <div className="container section animate-fade-in" style={{ minHeight: '80vh', paddingTop: '8rem' }}>
            <div className="flex flex-col items-center text-center gap-4 homepage__products-header">
                <h2 className="heading-2 section-title-underline in-view">Your Favourites</h2>
                <p className="text-muted">Items you've saved for later.</p>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="card text-center" style={{ padding: '6rem 2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                    <HeartCrack size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1.5rem' }} />
                    <h3 className="heading-3 mb-2">Your wishlist is empty</h3>
                    <p className="text-muted mb-6">Explore our collections and add your favourite items!</p>
                    <Link to="/categories" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#000', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <ShoppingCart size={18} /> Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="products-full-grid">
                    {wishlistItems.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
