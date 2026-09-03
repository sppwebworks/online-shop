import React from "react";
import styles from "./ProductFilters.module.css";

const RATING_TIERS = [4, 3, 2, 1];

const ProductFilters = ({
  categories,
  selectedCategories,
  onToggleCategory,
  brands,
  selectedBrands,
  onToggleBrand,
  colors,
  selectedColors,
  onToggleColor,
  priceBounds,
  priceMax,
  onPriceMaxChange,
  discountTiers,
  discountMin,
  onDiscountChange,
  ratingFilter,
  onRatingChange,
  activeFilterCount,
  onClear,
  onClose,
}) => {
  const effectiveMax = priceMax ?? priceBounds.max;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Filters</h2>
        <div className={styles.headerActions}>
          {activeFilterCount > 0 && (
            <button type="button" className={styles.clearBtn} onClick={onClear}>
              Clear all
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Category</h3>
        <div className={styles.checkList}>
          {categories.map((cat) => (
            <label key={cat.name} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.name)}
                onChange={() => onToggleCategory(cat.name)}
                className={styles.checkbox}
              />
              <span className={styles.checkLabel}>{cat.name}</span>
              <span className={styles.checkCount}>{cat.count}</span>
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Brand</h3>
          <div className={styles.checkList}>
            {brands.map((brand) => (
              <label key={brand.name} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand.name)}
                  onChange={() => onToggleBrand(brand.name)}
                  className={styles.checkbox}
                />
                <span className={styles.checkLabel}>{brand.name}</span>
                <span className={styles.checkCount}>{brand.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Max price</h3>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          value={effectiveMax}
          onChange={(e) => onPriceMaxChange(Number(e.target.value))}
          className={styles.priceSlider}
        />
        <div className={styles.priceLabels}>
          <span>${priceBounds.min.toFixed(0)}</span>
          <span className={styles.priceValue}>Up to ${effectiveMax.toFixed(0)}</span>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Discount</h3>
        <div className={styles.checkList}>
          {discountTiers.map((tier) => (
            <label key={tier.value} className={styles.checkRow}>
              <input
                type="radio"
                name="discount"
                checked={discountMin === tier.value}
                onChange={() => onDiscountChange(tier.value)}
                className={styles.checkbox}
              />
              <span className={styles.checkLabel}>{tier.value}% off or more</span>
              <span className={styles.checkCount}>{tier.count}</span>
            </label>
          ))}
          <label className={styles.checkRow}>
            <input
              type="radio"
              name="discount"
              checked={discountMin === 0}
              onChange={() => onDiscountChange(0)}
              className={styles.checkbox}
            />
            <span className={styles.checkLabel}>Any discount</span>
          </label>
        </div>
      </div>

      {colors.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Color</h3>
          <div className={styles.swatchGrid}>
            {colors.map((color) => (
              <button
                key={color.name}
                type="button"
                className={`${styles.swatchItem} ${
                  selectedColors.has(color.name) ? styles.swatchItemActive : ""
                }`}
                onClick={() => onToggleColor(color.name)}
                title={`${color.name} (${color.count})`}
              >
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: color.name }}
                />
                <span className={styles.swatchLabel}>{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Customer rating</h3>
        <div className={styles.checkList}>
          {RATING_TIERS.map((tier) => (
            <label key={tier} className={styles.checkRow}>
              <input
                type="radio"
                name="rating"
                checked={ratingFilter === tier}
                onChange={() => onRatingChange(tier)}
                className={styles.checkbox}
              />
              <span className={styles.stars}>
                {"★".repeat(tier)}
                <span className={styles.starsEmpty}>{"★".repeat(5 - tier)}</span>
              </span>
              <span className={styles.checkLabel}>&amp; up</span>
            </label>
          ))}
          <label className={styles.checkRow}>
            <input
              type="radio"
              name="rating"
              checked={ratingFilter === 0}
              onChange={() => onRatingChange(0)}
              className={styles.checkbox}
            />
            <span className={styles.checkLabel}>Any rating</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
