import React from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { categoryService } from "../../services/categoryService";
import styles from "./Footer.module.css";

const PAYMENT_METHODS = [
  { icon: "💳", label: "Card" },
  { icon: "📱", label: "UPI" },
  { icon: "🏦", label: "Net Banking" },
  { icon: "👛", label: "Wallet" },
  { icon: "💵", label: "COD" },
];

const Footer = () => {
  const { isAuthenticated } = useAdminAuth();
  const { data: categories } = useFetch((signal) => categoryService.getAllCategories(signal));
  const visibleCategories = (categories || []).filter((c) => !c.hidden).slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoMark} />
              Products<span className={styles.logoAccent}>App</span>
            </Link>
            <p className={styles.tagline}>
              A clean, fast catalog of quality products — curated categories,
              honest pricing, no clutter.
            </p>
            <div className={styles.paymentRow}>
              {PAYMENT_METHODS.map((method) => (
                <span key={method.label} className={styles.paymentBadge} title={method.label}>
                  {method.icon}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Shop</h3>
            <Link to="/" className={styles.link}>
              Home
            </Link>
            <Link to="/products" className={styles.link}>
              All Products
            </Link>
            <Link to="/cart" className={styles.link}>
              Cart
            </Link>
            <Link to="/wishlist" className={styles.link}>
              Wishlist
            </Link>
          </div>

          {visibleCategories.length > 0 && (
            <div className={styles.column}>
              <h3 className={styles.columnTitle}>Categories</h3>
              {visibleCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className={`${styles.link} ${styles.linkCapitalize}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Account</h3>
            {isAuthenticated ? (
              <Link to="/orders" className={styles.link}>
                My Orders
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.link}>
                  Sign In
                </Link>
                <Link to="/register" className={styles.link}>
                  Create Account
                </Link>
              </>
            )}
            <Link to="/forgot-password" className={styles.link}>
              Forgot Password
            </Link>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Support</h3>
            <p className={styles.infoLine}>7-day returns &amp; exchanges</p>
            <p className={styles.infoLine}>Free shipping on every order</p>
            <a href="mailto:support@productsapp.demo" className={styles.link}>
              support@productsapp.demo
            </a>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>© {year} ProductsApp. All rights reserved.</p>
          <p className={styles.demoNote}>A portfolio demo storefront.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
