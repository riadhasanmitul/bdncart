import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  clearCart: () => void;
  isLoadingCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    
    try {
      setIsLoadingCart(true);
      const response = await api.get('/cart');
      setCart(response.data.data.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoadingCart(false);
    }
  }, [user]);

  // Fetch cart when user logs in
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (variantId: string, quantity: number) => {
    if (!user) throw new Error("Must be logged in to add to cart");
    
    await api.post('/cart/items', { variantId, quantity });
    await fetchCart(); // Refresh cart to get accurate totals from server
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (!user) return;
    
    await api.patch(`/cart/items/${variantId}`, { quantity });
    await fetchCart();
  };

  const removeFromCart = async (variantId: string) => {
    if (!user) return;
    
    await api.delete(`/cart/items/${variantId}`);
    await fetchCart();
  };

  const clearCart = () => {
    setCart(null);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, isLoadingCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
