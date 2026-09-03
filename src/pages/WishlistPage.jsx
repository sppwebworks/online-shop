import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import styles from "./WishlistPage.module.css";

const WishlistPage = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🤍</span>
          <h1 className={styles.emptyTitle}>Your wishlist is empty</h1>
          <p className={styles.emptyText}>
            Save products you like by tapping the heart on their page.
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
      <h1 className={styles.title}>My Wishlist</h1>
      <p className={styles.subtitle}>
        {items.length} item{items.length !== 1 ? "s" : ""} saved
      </p>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeFromWishlist(item.id)}
              aria-label="Remove from wishlist"
            >
              ✕
            </button>
            <Link to={`/products/${item.id}`} className={styles.imageWrap}>
              <img src={item.image} alt={item.title} className={styles.image} />
            </Link>
            <div className={styles.info}>
              <Link to={`/products/${item.id}`} className={styles.itemTitle}>
                {item.title}
              </Link>
              <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
              <button
                type="button"
                className={styles.addToCartButton}
                onClick={() => addItem(item, 1)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
