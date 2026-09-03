import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import styles from "./AdminLayout.module.css";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/products", label: "Products", icon: "📦", end: true },
  { to: "/admin/products/new", label: "Add Product", icon: "➕" },
  { to: "/admin/categories", label: "Categories", icon: "🏷️" },
  { to: "/admin/orders", label: "Orders", icon: "🧾" },
  { to: "/admin/users", label: "Users", icon: "👤" },
];

function SidebarContent({ onLogout, onNavigate }) {
  return (
    <>
      <Link to="/admin" className={styles.brand} onClick={onNavigate}>
        <span className={styles.brandMark} />
        Admin Console
      </Link>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <Link to="/" className={styles.navLink} onClick={onNavigate}>
          <span className={styles.navIcon}>←</span> Back to Site
        </Link>
        <button className={styles.logoutButton} onClick={onLogout}>
          <span className={styles.navIcon}>⎋</span> Logout
        </button>
      </div>
    </>
  );
}

const AdminLayout = () => {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {isMobileNavOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className={styles.mobileSidebar}>
            <SidebarContent
              onLogout={handleLogout}
              onNavigate={() => setIsMobileNavOpen(false)}
            />
          </aside>
        </>
      )}

      <div className={styles.content}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className={styles.topbarSpacer} />
          <div className={styles.userBadge}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.userName}>{user?.name}</span>
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
