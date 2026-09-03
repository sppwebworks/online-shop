import React from "react";
import { Link } from "react-router-dom";
import { getDiscountPercent } from "../../utils/pricing";
import styles from "./ProductCard.module.css";

const ProductCard = ({ product }) => {
  const { id, title, price, image, category, brand, originalPrice, rating } = product;

  const truncatedTitle = title.length > 30 ? title.slice(0, 30) + "..." : title;
  const discountPercent = getDiscountPercent(product);
  const hasDiscount = discountPercent > 0;
  const hasRating = rating && rating.count > 0;
  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < 2 * 24 * 60 * 60 * 1000;

  return (
    <Link to={`/products/${id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {(isNew || hasDiscount) && (
          <div className={styles.cornerTags}>
            {isNew && <span className={`${styles.tag} ${styles.tagNew}`}>NEW</span>}
            {hasDiscount && (
              <span className={`${styles.tag} ${styles.tagSale}`}>
                -{discountPercent}%
              </span>
            )}
          </div>
        )}
        <img src={image} alt={title} className={styles.image} />
      </div>
      <div className={styles.content}>
        {brand ? (
          <span className={styles.brand}>{brand}</span>
        ) : (
          <span className={styles.category}>{category}</span>
        )}
        <h3 className={styles.title}>{truncatedTitle}</h3>
        <div className={styles.priceRow}>
          <span className={styles.price}>${price.toFixed(2)}</span>
          {hasDiscount && (
            <>
              <span className={styles.originalPrice}>
                ${originalPrice.toFixed(2)}
              </span>
              <span className={styles.discount}>{discountPercent}% OFF</span>
            </>
          )}
        </div>
        {hasRating && (
          <span className={styles.ratingBadge}>
            {rating.rate.toFixed(1)} ★
            <span className={styles.ratingCount}>({rating.count})</span>
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
