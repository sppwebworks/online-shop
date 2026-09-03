import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import ProductCard from "../components/products/ProductCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getDiscountPercent } from "../utils/pricing";
import styles from "./HomePage.module.css";

const CATEGORY_INITIAL_BG = [
  "#efe4d2",
  "#e5d9c3",
  "#f0e6da",
  "#e8dcc8",
  "#eee1cd",
  "#e3d5bd",
];

const ProductRail = ({ title, subtitle, products }) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
      <Link to="/products" className={styles.viewAllLink}>
        View All →
      </Link>
    </div>
    <div className={styles.rail}>
      {products.map((product) => (
        <div key={product.id} className={styles.railItem}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  </section>
);

const PromoCard = ({ eyebrow, title, subtitle, ctaLabel, image, to, dark }) => (
  <Link
    to={to}
    className={`${styles.promoCard} ${dark ? styles.promoCardDark : ""}`}
    style={{ backgroundImage: `url(${image})` }}
  >
    <div className={styles.promoCardOverlay}>
      <span className={styles.promoEyebrow}>{eyebrow}</span>
      <h3 className={styles.promoTitle}>{title}</h3>
      <p className={styles.promoSubtitle}>{subtitle}</p>
      <span className={styles.promoButton}>{ctaLabel}</span>
    </div>
  </Link>
);

const HomePage = () => {
  const { data: products, loading: productsLoading } = useFetch((signal) =>
    productService.getVisibleProducts(signal),
  );
  const { data: categories, loading: categoriesLoading } = useFetch((signal) =>
    categoryService.getAllCategories(signal),
  );

  const visibleCategories = useMemo(
    () => (categories || []).filter((c) => !c.hidden),
    [categories],
  );

  const trending = useMemo(() => {
    if (!products) return [];
    return [...products]
      .filter((p) => p.rating?.count > 0)
      .sort(
        (a, b) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count,
      )
      .slice(0, 8);
  }, [products]);

  const newArrivals = useMemo(() => {
    if (!products) return [];
    return [...products].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [products]);

  const deals = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
  }, [products]);

  const isLoading = productsLoading || categoriesLoading;
  const heroProduct = newArrivals[0] || trending[0] || null;
  const topRatedProduct = trending[0] || null;
  const newestProduct = newArrivals[0] || null;
  const bestDeal = deals[0] || null;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.heroKicker}>
            {heroProduct ? "New Arrivals" : "Welcome"}
          </span>
          <h1 className={styles.heroTitle}>
            Style That Fits <span className={styles.heroAccent}>Your Life</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover a curated catalog of quality products — honest pricing,
            real reviews, no clutter.
          </p>
          <div className={styles.heroActions}>
            <Link to="/products" className={styles.heroPrimaryBtn}>
              Shop Now
            </Link>
            <Link to="/products" className={styles.heroSecondaryBtn}>
              View Collection
            </Link>
          </div>
          <div className={styles.trustRow}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🚚</span>
              <span>Free Shipping</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>↩️</span>
              <span>Easy Returns</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔒</span>
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
        {heroProduct && (
          <Link to={`/products/${heroProduct.id}`} className={styles.heroImageWrap}>
            <img
              src={heroProduct.image}
              alt={heroProduct.title}
              className={styles.heroImage}
            />
          </Link>
        )}
      </section>

      {visibleCategories.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
          </div>
          <div className={styles.categoryRow}>
            {visibleCategories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className={styles.categoryTile}
              >
                <span
                  className={styles.categoryCircle}
                  style={
                    !category.image
                      ? {
                          background:
                            CATEGORY_INITIAL_BG[index % CATEGORY_INITIAL_BG.length],
                        }
                      : undefined
                  }
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className={styles.categoryImage}
                    />
                  ) : (
                    category.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className={styles.categoryLabel}>{category.name}</span>
                {typeof category.productCount === "number" && (
                  <span className={styles.categoryCount}>
                    {category.productCount} items
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isLoading && (topRatedProduct || bestDeal) && newestProduct && (
        <section className={styles.promoGrid}>
          {bestDeal ? (
            <PromoCard
              eyebrow="Limited-Time Offer"
              title={`Up to ${getDiscountPercent(bestDeal)}% Off`}
              subtitle="On selected items"
              ctaLabel="Shop Now →"
              image={bestDeal.image}
              to={`/products/${bestDeal.id}`}
            />
          ) : (
            topRatedProduct && (
              <PromoCard
                eyebrow="Customer Favorite"
                title="Top Rated Picks"
                subtitle={`Rated ${topRatedProduct.rating.rate.toFixed(1)}★ by shoppers`}
                ctaLabel="Shop Now →"
                image={topRatedProduct.image}
                to={`/products/${topRatedProduct.id}`}
              />
            )
          )}
          <PromoCard
            eyebrow="Just Landed"
            title="Discover The Latest"
            subtitle="Fresh additions to the catalog"
            ctaLabel="Explore →"
            image={newestProduct.image}
            to={`/products/${newestProduct.id}`}
            dark
          />
        </section>
      )}

      {isLoading && (
        <div className={styles.loadingWrap}>
          <LoadingSpinner message="Loading picks for you..." />
        </div>
      )}

      {!isLoading && trending.length > 0 && (
        <ProductRail
          title="Trending Products"
          subtitle="Highest rated by customers"
          products={trending}
        />
      )}

      {!isLoading && deals.length > 0 && (
        <ProductRail
          title="Deals For You"
          subtitle="Limited-time price drops"
          products={deals.slice(0, 8)}
        />
      )}

      {!isLoading && newArrivals.length > 0 && (
        <ProductRail
          title="New Arrivals"
          subtitle="Fresh additions to the catalog"
          products={newArrivals.slice(0, 8)}
        />
      )}

      <section className={styles.ctaBanner}>
        <div>
          <h2 className={styles.ctaBannerTitle}>
            Find exactly what you&apos;re looking for
          </h2>
          <p className={styles.ctaBannerSubtitle}>
            Browse the full catalog across every category.
          </p>
        </div>
        <Link to="/products" className={styles.ctaBannerButton}>
          Explore All Products →
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
