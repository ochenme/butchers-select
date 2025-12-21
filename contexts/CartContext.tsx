import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // Fix: The `useAuth` hook returns `user`, not `member`.
  const { user } = useAuth();

  const getStorageKey = (uid: string) => `cart_items_${uid}`;

  useEffect(() => {
    if (user) {
      const storedCart = localStorage.getItem(getStorageKey(user.uid));

      if (storedCart) {
        try {
          const parsedCart: CartItem[] = JSON.parse(storedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error('Failed to parse stored cart data', error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }

      return;
    }

    setCartItems([]);
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(getStorageKey(user.uid), JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (product: Product) => {
    if (!user) {
      return false;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });

    return true;
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };
  
  const clearCart = () => {
    setCartItems([]);

    if (user) {
      localStorage.removeItem(getStorageKey(user.uid));
    }
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}>
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
