// ============================================================================
// CartContext.jsx — Authenticated server-cart state for Technical Mandi.
//
// AUTH-FIRST CHANGE
// The backend requires authentication for catalogue and cart endpoints, and
// App.jsx now protects the complete marketplace. Consequently there is no
// guest/localStorage cart and no guest-to-server merge step. The Django cart is
// the single source of truth from the moment the user enters the storefront.
//
// RESPONSIBILITIES
//   - Load the current user's cart immediately after authentication.
//   - Normalise backend cart items into one stable shape for all UI components.
//   - Send add/update/remove/clear mutations to the protected API.
//   - Expose derived item count and total value.
//   - Increment bumpTick after additions so Navbar can animate its cart badge.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { ENDPOINTS, getApiErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function normaliseCart(serverCart) {
  return (serverCart?.items || []).map((item) => ({
    productId: item.product.id,
    product: item.product,
    quantity: item.quantity,
    lineTotal: Number(item.line_total),
    serverItemId: item.id,
  }));
}

// Mutation endpoints return `{ cart: ... }` in the current frontend contract,
// while GET /cart/ returns the cart object directly. This helper supports both.
function extractCart(payload) {
  return payload?.cart || payload;
}

export function CartProvider({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bumpTick, setBumpTick] = useState(0);

  const applyServerCart = useCallback((serverCart) => {
    setItems(normaliseCart(serverCart));
  }, []);

  const refreshServerCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.cart);
      applyServerCart(extractCart(data));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyServerCart]);

  // Wait for AuthContext to finish validating any stored token. Afterwards,
  // authenticated users receive their server cart; logged-out users hold no
  // catalogue/cart state and will be redirected to /login by route guards.
  useEffect(() => {
    if (initializing) return;

    if (isAuthenticated) {
      refreshServerCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, initializing, refreshServerCart]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!isAuthenticated) {
      return { ok: false, message: 'Please log in before using the cart.' };
    }

    setLoading(true);
    try {
      const { data } = await api.post(ENDPOINTS.cartAdd, {
        product_id: product.id,
        quantity,
      });
      applyServerCart(extractCart(data));
      setBumpTick((current) => current + 1);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: getApiErrorMessage(error, 'Could not add this product to your cart.'),
      };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyServerCart]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (!isAuthenticated) {
      return { ok: false, message: 'Please log in before updating the cart.' };
    }

    setLoading(true);
    try {
      const { data } = await api.patch(ENDPOINTS.cartUpdate(productId), { quantity });
      applyServerCart(extractCart(data));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: getApiErrorMessage(error, 'Could not update the quantity.'),
      };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyServerCart]);

  const removeFromCart = useCallback(async (productId) => {
    if (!isAuthenticated) return { ok: false };

    setLoading(true);
    try {
      const { data } = await api.delete(ENDPOINTS.cartRemove(productId));
      applyServerCart(extractCart(data));
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyServerCart]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) return { ok: false };

    setLoading(true);
    try {
      const { data } = await api.delete(ENDPOINTS.cartClear);
      applyServerCart(extractCart(data));
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyServerCart]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [items],
  );

  const value = useMemo(() => ({
    items,
    totalItems,
    cartTotal,
    loading,
    bumpTick,
    // Retained as `false` for compatibility with any older component that may
    // still read the property while files are being replaced incrementally.
    isGuestCart: false,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshServerCart,
  }), [
    items, totalItems, cartTotal, loading, bumpTick,
    addToCart, updateQuantity, removeFromCart, clearCart, refreshServerCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a <CartProvider>');
  return context;
}
