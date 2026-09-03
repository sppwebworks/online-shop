import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import LoadingSpinner from "../common/LoadingSpinner";
import { getDiscountPercent, getProductColors } from "../../utils/pricing";
import styles from "./ProductList.module.css";

const DISCOUNT_TIER_VALUES = [10, 25, 50, 70];

const parseCategoryParam = (raw) =>
  new Set(
    (raw || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  );

const ProductList = ({ products, loading, error }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(() =>
    parseCategoryParam(searchParams.get("category")),
  );
  const [selectedBrands, setSelectedBrands] = useState(() => new Set());
  const [selectedColors, setSelectedColors] = useState(() => new Set());
  const [priceMax, setPriceMax] = useState(null);
  const [discountMin, setDiscountMin] = useState(0);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Keeps the filter in sync if the category changes via the URL (e.g. a
  // footer link) after this component is already mounted.
  useEffect(() => {
    setSelectedCategories(parseCategoryParam(searchParams.get("category")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const priceBounds = useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  // A single predicate, reused for the final result set and for each
  // facet's own counts — `skip` lets a facet ignore its own selection so its
  // counts read as "if I also picked this" rather than collapsing to 0 the
  // moment something in that same facet is already selected.
  const matchesFilters = useCallback(
    (p, skip = {}) => {
      if (!skip.category && selectedCategories.size > 0 && !selectedCategories.has(p.category)) {
        return false;
      }
      if (!skip.brand && selectedBrands.size > 0 && !selectedBrands.has(p.brand)) {
        return false;
      }
      if (!skip.color && selectedColors.size > 0) {
        const productColors = getProductColors(p);
        const hasMatch = [...selectedColors].some((c) => productColors.has(c));
        if (!hasMatch) return false;
      }
      if (!skip.discount && discountMin > 0 && getDiscountPercent(p) < discountMin) {
        return false;
      }
      if (priceMax !== null && p.price > priceMax) return false;
      if (ratingFilter > 0 && (p.rating?.rate || 0) < ratingFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        if (
          !p.title.toLowerCase().includes(term) &&
          !p.category.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    },
    [selectedCategories, selectedBrands, selectedColors, discountMin, priceMax, ratingFilter, searchTerm],
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => matchesFilters(p));
  }, [products, matchesFilters]);

  const categories = useMemo(() => {
    if (!products) return [];
    const pool = products.filter((p) => matchesFilters(p, { category: true }));
    const counts = new Map();
    pool.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const allCats = new Set(products.map((p) => p.category));
    return [...allCats].sort().map((name) => ({ name, count: counts.get(name) || 0 }));
  }, [products, matchesFilters]);

  const brands = useMemo(() => {
    if (!products) return [];
    const allBrands = new Set(products.map((p) => p.brand).filter(Boolean));
    if (allBrands.size === 0) return [];
    const pool = products.filter((p) => matchesFilters(p, { brand: true }));
    const counts = new Map();
    pool.forEach((p) => {
      if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
    });
    return [...allBrands].sort().map((name) => ({ name, count: counts.get(name) || 0 }));
  }, [products, matchesFilters]);

  const colors = useMemo(() => {
    if (!products) return [];
    const allColors = new Set();
    products.forEach((p) => getProductColors(p).forEach((c) => allColors.add(c)));
    if (allColors.size === 0) return [];
    const pool = products.filter((p) => matchesFilters(p, { color: true }));
    const counts = new Map();
    pool.forEach((p) => {
      getProductColors(p).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
    });
    return [...allColors].sort().map((name) => ({ name, count: counts.get(name) || 0 }));
  }, [products, matchesFilters]);

  const discountTiers = useMemo(() => {
    if (!products) return [];
    const pool = products.filter((p) => matchesFilters(p, { discount: true }));
    return DISCOUNT_TIER_VALUES.map((value) => ({
      value,
      count: pool.filter((p) => getDiscountPercent(p) >= value).length,
    }));
  }, [products, matchesFilters]);

  const activeFilterCount =
    selectedCategories.size +
    selectedBrands.size +
    selectedColors.size +
    (priceMax !== null && priceMax < priceBounds.max ? 1 : 0) +
    (discountMin > 0 ? 1 : 0) +
    (ratingFilter > 0 ? 1 : 0);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleToggleCategory = useCallback(
    (name) => {
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }
        const joined = [...next].join(",");
        setSearchParams(joined ? { category: joined } : {});
        return next;
      });
    },
    [setSearchParams],
  );

  const handleToggleBrand = useCallback((name) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const handleToggleColor = useCallback((name) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedColors(new Set());
    setPriceMax(null);
    setDiscountMin(0);
    setRatingFilter(0);
    setSearchParams({});
  }, [setSearchParams]);

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!products || products.length === 0) {
    return <div className={styles.noResults}>No products available</div>;
  }

  const filtersProps = {
    categories,
    selectedCategories,
    onToggleCategory: handleToggleCategory,
    brands,
    selectedBrands,
    onToggleBrand: handleToggleBrand,
    colors,
    selectedColors,
    onToggleColor: handleToggleColor,
    priceBounds,
    priceMax,
    onPriceMaxChange: setPriceMax,
    discountTiers,
    discountMin,
    onDiscountChange: setDiscountMin,
    ratingFilter,
    onRatingChange: setRatingFilter,
    activeFilterCount,
    onClear: handleClearFilters,
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <ProductFilters {...filtersProps} />
      </aside>

      {isDrawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <ProductFilters {...filtersProps} onClose={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setIsDrawerOpen(true)}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <div className={styles.stats}>
          Showing {filteredProducts.length} of {products.length} products
        </div>

        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.noResults}>
            No products found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
