import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import styles from "./CartPage.module.css";

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <h1 className={styles.emptyTitle}>Your cart is empty</h1>
          <p className={styles.emptyText}>
            Browse the catalog and add something you like.
          </p>
          <Link to="/products" className={styles.browseButton}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Cart</h1>
      <p className={styles.subtitle}>
        {items.length} item{items.length !== 1 ? "s" : ""} in your cart
      </p>

      <div className={styles.layout}>
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.key} className={styles.item}>
              <Link to={`/products/${item.id}`} className={styles.itemImageWrap}>
                <img
                  src={item.image}
                  alt={item.title}
                  className={styles.itemImage}
                />
              </Link>
              <div className={styles.itemInfo}>
                <Link to={`/products/${item.id}`} className={styles.itemTitle}>
                  {item.title}
                </Link>
                {(item.size || item.color) && (
                  <p className={styles.itemVariant}>
                    {[item.size, item.color].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
              </div>
              <div className={styles.itemQuantity}>
                <button
                  onClick={() => updateQuantity(item.key, item.quantity - 1)}
                  className={styles.quantityBtn}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className={styles.quantityValue}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.key, item.quantity + 1)}
                  className={styles.quantityBtn}
                  disabled={item.quantity >= (item.maxStock || 10)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p className={styles.lineTotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.key)}
                className={styles.removeButton}
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span className={styles.freeShipping}>Free</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <Link to="/checkout" className={styles.checkoutButton}>
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
