import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import styles from "./Header.module.css";

const Header = () => {
  const { toggleTheme, isDark } = useTheme();
  const { isAuthenticated, user, logout } = useAdminAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const navLinks = (
    <>
      <Link
        to="/"
        className={`${styles.navLink} ${location.pathname === "/" ? styles.active : ""}`}
      >
        Home
      </Link>
      <Link
        to="/products"
        className={`${styles.navLink} ${location.pathname === "/products" ? styles.active : ""}`}
      >
        Products
      </Link>
      {isAuthenticated && (
        <Link
          to="/orders"
          className={`${styles.navLink} ${location.pathname === "/orders" ? styles.active : ""}`}
        >
          My Orders
        </Link>
      )}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityBarInner}>
          <span>Free shipping on every order · Easy 7-day returns</span>
          <a href="mailto:support@productsapp.demo">Need help? Contact support</a>
        </div>
      </div>
      <div className={styles.mainBar}>
       <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark} />
          Products<span className={styles.logoAccent}>App</span>
        </Link>

        <nav className={styles.nav}>{navLinks}</nav>

        <div className={styles.actions}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <Link to="/wishlist" className={styles.cartButton} aria-label="Wishlist">
            🤍
            {wishlistItems.length > 0 && (
              <span className={styles.cartBadge}>{wishlistItems.length}</span>
            )}
          </Link>

          <Link to="/cart" className={styles.cartButton} aria-label="Cart">
            🛒
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </Link>

          <div className={styles.desktopAccount}>
            {isAuthenticated ? (
              <div className={styles.account}>
                <span className={styles.userName}>{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className={styles.loginButton}>
                Log In
              </Link>
            )}
          </div>

          <button
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
       </div>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>{navLinks}</nav>
          <div className={styles.mobileAccount}>
            {isAuthenticated ? (
              <>
                <span className={styles.userName}>{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.loginButton}>
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
