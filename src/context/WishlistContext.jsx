import React, { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};

// Per-browser wishlist (not tied to an account) — just the product summary
// needed to render a wishlist page, keyed by product id so toggling is a
// simple presence check.
export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useLocalStorage("wishlist", []);

  const isWishlisted = (productId) => items.some((item) => item.id === productId);

  const toggleWishlist = (product) => {
    setItems((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [
            ...prev,
            {
              id: product.id,
              title: product.title,
              image: product.image,
              price: product.price,
            },
          ],
    );
  };

  const removeFromWishlist = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const value = { items, isWishlisted, toggleWishlist, removeFromWishlist };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
