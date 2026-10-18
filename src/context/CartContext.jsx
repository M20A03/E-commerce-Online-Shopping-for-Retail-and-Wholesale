// IMPROVEMENT: Optimized CartContext with Wholesale Tiered Pricing, useCallback/useMemo, and ToastContext integration
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useToast } from './ToastContext';

/**
 * Calculates wholesale tiered pricing dynamically based on item quantity.
 * Tiers:
 *  - 10-49 units: 6% wholesale discount
 *  - 50-99 units: 12% wholesale discount
 *  - 100+ units: 20% bulk wholesale discount
 */
export const calculateTieredPrice = (basePrice, quantity) => {
  const price = Number(basePrice) || 0;
  const qty = Number(quantity) || 1;

  if (qty >= 100) {
    const discounted = price * 0.80;
    return {
      unitPrice: Number(discounted.toFixed(2)),
      originalUnitPrice: price,
      discountPercent: 20,
      tierName: 'Tier 3 (100+ Mega Bulk)',
      total: Number((discounted * qty).toFixed(2)),
      savings: Number(((price - discounted) * qty).toFixed(2))
    };
  }

  if (qty >= 50) {
    const discounted = price * 0.88;
    return {
      unitPrice: Number(discounted.toFixed(2)),
      originalUnitPrice: price,
      discountPercent: 12,
      tierName: 'Tier 2 (50+ Wholesale)',
      total: Number((discounted * qty).toFixed(2)),
      savings: Number(((price - discounted) * qty).toFixed(2))
    };
  }

  if (qty >= 10) {
    const discounted = price * 0.94;
    return {
      unitPrice: Number(discounted.toFixed(2)),
      originalUnitPrice: price,
      discountPercent: 6,
      tierName: 'Tier 1 (10+ Wholesale)',
      total: Number((discounted * qty).toFixed(2)),
      savings: Number(((price - discounted) * qty).toFixed(2))
    };
  }

  return {
    unitPrice: price,
    originalUnitPrice: price,
    discountPercent: 0,
    tierName: 'Retail',
    total: Number((price * qty).toFixed(2)),
    savings: 0
  };
};

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('luxe_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const { addToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem('luxe_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });

    if (addToast) {
      addToast(`Added ${product.name || product.title || 'item'} to cart!`, 'success');
    }
  }, [addToast]);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => {
      const filtered = prevCart.filter((item) => item.id !== productId);
      if (filtered.length < prevCart.length && addToast) {
        addToast('Item removed from cart.', 'info');
      }
      return filtered;
    });
  }, [addToast]);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Total cart calculation with wholesale tiered pricing dynamically applied
  const getCartTotal = useCallback(() => {
    const total = cart.reduce((sum, item) => {
      const { total: itemTotal } = calculateTieredPrice(item.price, item.quantity);
      return sum + itemTotal;
    }, 0);
    return Number(total.toFixed(2));
  }, [cart]);

  // Total savings from wholesale tiered discounts
  const getWholesaleSavings = useCallback(() => {
    const savings = cart.reduce((sum, item) => {
      const { savings: itemSavings } = calculateTieredPrice(item.price, item.quantity);
      return sum + itemSavings;
    }, 0);
    return Number(savings.toFixed(2));
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getWholesaleSavings,
    getCartCount,
    calculateTieredPrice
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getWholesaleSavings, getCartCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
