import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import LoadingSpinner from "../common/LoadingSpinner";
import ReviewSection from "./ReviewSection";
import styles from "./ProductDetails.module.css";

const SIZE_CHART_ROWS = [
  { size: "S", chest: "36-38", length: "27" },
  { size: "M", chest: "38-40", length: "28" },
  { size: "L", chest: "40-42", length: "29" },
  { size: "XL", chest: "42-44", length: "30" },
  { size: "XXL", chest: "44-46", length: "31" },
];

// Generic reference measurements only — not tied to this specific garment,
// since we don't collect per-product measurement data. Clearly a rough
// guide, not a certified fit chart.
const SizeChart = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.sizeChartWrap}>
      <button type="button" className={styles.sizeChartLink} onClick={() => setOpen((p) => !p)}>
        Size Chart {open ? "▲" : "▼"}
      </button>
      {open && (
        <table className={styles.sizeChartTable}>
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest (in)</th>
              <th>Length (in)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART_ROWS.map((row) => (
              <tr key={row.size}>
                <td>{row.size}</td>
                <td>{row.chest}</td>
                <td>{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Deliberately generic and unbranded — no real bank/card names or specific
// live promo codes, since presenting those would look like real financial
// offers rather than sample UI content.
const BestOffers = () => (
  <div className={styles.offersBox}>
    <span className={styles.offersLabel}>Available Offers</span>
    <ul className={styles.offersList}>
      <li>
        <span className={styles.offerIcon}>🏷️</span>
        <span>
          <strong>Bank Offer:</strong> 10% instant discount with select bank cards (demo)
        </span>
      </li>
      <li>
        <span className={styles.offerIcon}>🎟️</span>
        <span>
          <strong>Coupon:</strong> Use code <code>WELCOME10</code> for 10% off on your first order
        </span>
      </li>
      <li>
        <span className={styles.offerIcon}>💳</span>
        <span>
          <strong>No Cost EMI</strong> available on orders above $200
        </span>
      </li>
    </ul>
  </div>
);

// Cosmetic only — this app has no real courier/serviceability integration,
// so it always reports the same generic estimate rather than pretending to
// check a specific address.
const DeliveryCheck = () => {
  const [pincode, setPincode] = useState("");
  const [checked, setChecked] = useState(false);

  const handleCheck = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) return;
    setChecked(true);
  };

  return (
    <div className={styles.deliveryBox}>
      <span className={styles.deliveryLabel}>Delivery Options</span>
      <form className={styles.deliveryForm} onSubmit={handleCheck}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setChecked(false);
          }}
          placeholder="Enter pincode"
          className={styles.deliveryInput}
        />
        <button type="submit" className={styles.deliveryCheckButton}>
          Check
        </button>
      </form>
      {checked && (
        <p className={styles.deliveryResult}>
          ✓ Delivery available · Estimated 3-5 business days
        </p>
      )}
      <ul className={styles.deliveryPerks}>
        <li>100% original products</li>
        <li>Pay on delivery available</li>
        <li>Easy 7 day return &amp; exchange</li>
      </ul>
    </div>
  );
};

const COLOR_HEX = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#111827",
};

const ProductDetails = ({ product, loading, error, relatedProducts }) => {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const baseGallery = useMemo(() => {
    if (!product) return [];
    return product.images && product.images.length > 0 ? product.images : [product.image];
  }, [product]);

  const hasVariants = Boolean(product?.variants && product.variants.length > 0);
  const availableSizes = useMemo(
    () => [...new Set((product?.variants || []).map((v) => v.size))].filter(Boolean),
    [product],
  );
  const availableColors = useMemo(
    () => [...new Set((product?.variants || []).map((v) => v.color))].filter(Boolean),
    [product],
  );

  const colorImageSets = product?.colorImages || [];
  const imagesForColor = (color) =>
    colorImageSets.find((c) => c.color === color)?.images || [];

  // A color with its own photos swaps the whole gallery to show that exact
  // variant; a color with none just keeps showing the shared product photos.
  const gallery = useMemo(() => {
    const colorSpecific = selectedColor ? imagesForColor(selectedColor) : [];
    return colorSpecific.length > 0 ? colorSpecific : baseGallery;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseGallery, selectedColor, colorImageSets]);

  useEffect(() => {
    setActiveImage(0);
    setSelectedSize(availableSizes.length === 1 ? availableSizes[0] : "");
    setSelectedColor(availableColors.length === 1 ? availableColors[0] : "");
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      product.variants.find(
        (v) => (v.size || "") === selectedSize && (v.color || "") === selectedColor,
      ) || null
    );
  }, [hasVariants, product, selectedSize, selectedColor]);

  const needsSizeChoice = availableSizes.length > 0 && !selectedSize;
  const needsColorChoice = availableColors.length > 0 && !selectedColor;
  const stock = hasVariants ? selectedVariant?.stock ?? null : null;
  const maxQuantity = hasVariants ? Math.min(10, stock ?? 0) : 10;

  const ratingStars = useMemo(() => {
    if (!product?.rating) return "";
    const rate = product.rating.rate;
    const fullStars = Math.floor(rate);
    const halfStar = rate % 1 >= 0.5;
    return "★".repeat(fullStars) + (halfStar ? "½" : "");
  }, [product]);

  const toggleDescription = useCallback(() => {
    setShowFullDescription((prev) => !prev);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  }, []);

  const incrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.min(prev + 1, maxQuantity || 10));
  }, [maxQuantity]);

  const handleAddToCart = useCallback(() => {
    addItem(product, quantity, {
      size: selectedSize,
      color: selectedColor,
      maxStock: hasVariants ? stock : undefined,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }, [addItem, product, quantity, selectedSize, selectedColor, hasVariants, stock]);

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!product) {
    return <div className={styles.notFound}>Product not found</div>;
  }

  const description = showFullDescription
    ? product.description
    : product.description.slice(0, 220) +
      (product.description.length > 220 ? "…" : "");

  const canAddToCart =
    !hasVariants || (selectedVariant && (selectedVariant.stock ?? 0) > 0);
  const addToCartLabel = justAdded
    ? "Added ✓"
    : needsSizeChoice
      ? "Select a size"
      : needsColorChoice
        ? "Select a color"
        : hasVariants && selectedVariant && selectedVariant.stock === 0
          ? "Out of Stock"
          : "Add to Cart";

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span className={styles.separator}>/</span>
        <Link to="/products">Products</Link>
        <span className={styles.separator}>/</span>
        <span className={styles.current}>{product.category}</span>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.gallery}>
          <div className={styles.imageWrap}>
            <img
              src={gallery[activeImage]}
              alt={product.title}
              className={styles.image}
            />
          </div>
          {gallery.length > 1 && (
            <div className={styles.thumbnailRow}>
              {gallery.map((img, index) => (
                <button
                  key={img + index}
                  type="button"
                  className={`${styles.thumbnailButton} ${
                    index === activeImage ? styles.thumbnailActive : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img} alt="" className={styles.thumbnailImage} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.category}>{product.category}</span>
          <h1 className={styles.productTitle}>{product.title}</h1>

          <div className={styles.ratingRow}>
            <span className={styles.stars}>{ratingStars}</span>
            <span className={styles.ratingText}>
              {product.rating?.rate ?? "—"} · {product.rating?.count ?? 0}{" "}
              reviews
            </span>
          </div>

          <p className={styles.priceRow}>
            <span className={styles.price}>${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className={styles.originalPrice}>
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className={styles.discountBadge}>
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </p>
          <p className={styles.taxNote}>Inclusive of all taxes</p>

          {(product.brand || product.weight || product.gender) && (
            <p className={styles.metaRow}>
              {[product.brand, product.weight, product.gender].filter(Boolean).join(" · ")}
            </p>
          )}

          <p className={styles.description}>
            {description}{" "}
            {product.description.length > 220 && (
              <button onClick={toggleDescription} className={styles.readMore}>
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </p>

          {availableSizes.length > 0 && (
            <div className={styles.optionGroup}>
              <div className={styles.optionLabelRow}>
                <span className={styles.optionLabel}>Size</span>
                <SizeChart />
              </div>
              <div className={styles.optionRow}>
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizeOption} ${
                      selectedSize === size ? styles.optionActive : ""
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableColors.length > 0 && (
            <div className={styles.optionGroup}>
              <span className={styles.optionLabel}>
                More Colors{selectedColor ? ` — ${selectedColor}` : ""}
              </span>
              <div className={styles.colorThumbRow}>
                {availableColors.map((color) => {
                  const thumbImage = imagesForColor(color)[0];
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorThumb} ${
                        selectedColor === color ? styles.colorThumbActive : ""
                      }`}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      aria-label={color}
                    >
                      {thumbImage ? (
                        <img src={thumbImage} alt={color} className={styles.colorThumbImage} />
                      ) : (
                        <span
                          className={styles.colorThumbSwatch}
                          style={{ background: COLOR_HEX[color] || color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasVariants && selectedVariant && (
            <p
              className={`${styles.stockLine} ${
                selectedVariant.stock === 0 ? styles.stockLineOut : ""
              }`}
            >
              {selectedVariant.stock === 0
                ? "Out of stock"
                : selectedVariant.stock <= 5
                  ? `Only ${selectedVariant.stock} left in stock`
                  : "In stock"}
            </p>
          )}

          <div className={styles.purchaseRow}>
            <div className={styles.quantityControl}>
              <button
                onClick={decrementQuantity}
                className={styles.quantityBtn}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button
                onClick={incrementQuantity}
                className={styles.quantityBtn}
                disabled={quantity >= (hasVariants ? maxQuantity : 10)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className={styles.addToCart}
              disabled={!canAddToCart || needsSizeChoice || needsColorChoice}
            >
              {addToCartLabel}
            </button>
            <button
              type="button"
              className={`${styles.wishlistButton} ${
                isWishlisted(product.id) ? styles.wishlistButtonActive : ""
              }`}
              onClick={() => toggleWishlist(product)}
              aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isWishlisted(product.id) ? "❤️" : "🤍"} Wishlist
            </button>
          </div>

          <BestOffers />

          <DeliveryCheck />

          {(product.brand || product.weight || product.gender || product.sku) && (
            <div className={styles.specs}>
              <h2 className={styles.specsTitle}>Product Details</h2>
              <table className={styles.specsTable}>
                <tbody>
                  {product.brand && (
                    <tr>
                      <td>Brand</td>
                      <td>{product.brand}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Category</td>
                    <td className={styles.specCapitalize}>{product.category}</td>
                  </tr>
                  {product.gender && (
                    <tr>
                      <td>Gender</td>
                      <td className={styles.specCapitalize}>{product.gender}</td>
                    </tr>
                  )}
                  {product.weight && (
                    <tr>
                      <td>Weight</td>
                      <td>{product.weight}</td>
                    </tr>
                  )}
                  {product.sku && (
                    <tr>
                      <td>SKU</td>
                      <td>{product.sku}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReviewSection productId={product.id} />

      {relatedProducts && relatedProducts.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>You might also like</h2>
            <Link to="/products" className={styles.viewAllLink}>
              View all →
            </Link>
          </div>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/products/${relatedProduct.id}`}
                className={styles.relatedCard}
              >
                <div className={styles.relatedImageWrap}>
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.title}
                    className={styles.relatedImage}
                  />
                </div>
                <div className={styles.relatedInfo}>
                  <h4 className={styles.relatedTitle}>
                    {relatedProduct.title.slice(0, 40)}
                    {relatedProduct.title.length > 40 ? "…" : ""}
                  </h4>
                  <p className={styles.relatedPrice}>
                    ${relatedProduct.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
