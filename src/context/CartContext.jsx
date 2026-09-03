import React, { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// A cart line is identified by product + size + color, not just product id —
// two different sizes of the same product are separate lines, each with
// their own quantity capped to that variant's own stock.
const makeKey = (id, size, color) => `${id}::${size || ""}::${color || ""}`;

export const CartProvider = ({ children }) => {
  const [items, setItems] = useLocalStorage("cart", []);

  const addItem = (product, quantity = 1, variant = {}) => {
    const { size = "", color = "", maxStock } = variant;
    const key = makeKey(product.id, size, color);
    const cap = maxStock != null ? Math.max(0, Math.min(10, maxStock)) : 10;

    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(item.quantity + quantity, cap || item.quantity) }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          title: product.title,
          image: product.image,
          price: product.price,
          size,
          color,
          maxStock: cap,
          quantity: Math.min(quantity, cap || quantity),
        },
      ];
    });
  };

  const updateQuantity = (key, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock || 10)) }
          : item,
      ),
    );
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};
