import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { usePagination } from "../../hooks/usePagination";
import { productService } from "../../services/productService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/admin/StatCard";
import Pagination from "../../components/admin/Pagination";
import styles from "./AdminProductsPage.module.css";

const PAGE_SIZE = 8;

// `null` means "not variant-tracked" (legacy product, or created without
// any stock entered) — shown as a neutral dash rather than a false zero.
const getStock = (product) => {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
};

const AdminProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState("table");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const {
    data: products,
    loading,
    error,
    refetch,
  } = useFetch((signal) => productService.getAllProducts(signal));

  const stats = useMemo(() => {
    if (!products || products.length === 0) {
      return { total: 0, categories: 0, totalValue: 0 };
    }
    const categories = new Set(products.map((p) => p.category));
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    return { total: products.length, categories: categories.size, totalValue };
  }, [products]);

  const categoryOptions = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.category))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const matchesTerm =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesTerm && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const {
    page,
    setPage,
    totalPages,
    pageItems: pageProducts,
    totalItems,
  } = usePagination(filteredProducts, PAGE_SIZE);

  const resetToFirstPage = () => setPage(1);

  const handleDelete = useCallback(
    async (product) => {
      if (!window.confirm(`Delete "${product.title}"?`)) return;

      setDeletingId(product.id);
      try {
        await productService.deleteProduct(product.id);
        setSelectedIds((prev) => {
          if (!prev.has(product.id)) return prev;
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        refetch();
      } catch (err) {
        window.alert(err.message || "Failed to delete product");
      } finally {
        setDeletingId(null);
      }
    },
    [refetch],
  );

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allPageSelected =
    pageProducts.length > 0 && pageProducts.every((p) => selectedIds.has(p.id));
  const somePageSelected = pageProducts.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = pageProducts.length > 0 && pageProducts.every((p) => prev.has(p.id));
      const next = new Set(prev);
      pageProducts.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }, [pageProducts]);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected product${ids.length !== 1 ? "s" : ""}?`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => productService.deleteProduct(id)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setSelectedIds(new Set());
      refetch();
      if (failed > 0) {
        window.alert(`${failed} of ${ids.length} product(s) could not be deleted.`);
      }
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, refetch]);

  if (loading) return <LoadingSpinner message="Loading products..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <Link to="/admin/products/new" className={styles.addButton}>
          + Add Product
        </Link>
      </div>

      <div className={styles.grid}>
        <StatCard icon="📦" label="Total Products" value={stats.total} accent="indigo" />
        <StatCard icon="🏷️" label="Categories" value={stats.categories} accent="purple" />
        <StatCard
          icon="💰"
          label="Inventory Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          accent="green"
        />
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
          className={styles.searchInput}
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            resetToFirstPage();
          }}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "table" ? styles.viewActive : ""}`}
            onClick={() => setView("table")}
            title="Table view"
          >
            ☰
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${view === "grid" ? styles.viewActive : ""}`}
            onClick={() => setView("grid")}
            title="Grid view"
          >
            ▦
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selectedIds.size} selected</span>
            <button
              type="button"
              className={styles.clearSelectionButton}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.bulkDeleteButton}
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.noResultsStandalone}>No products found</div>
      ) : view === "table" ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allPageSelected && somePageSelected;
                    }}
                    onChange={toggleSelectAll}
                    aria-label="Select all products on this page"
                  />
                </th>
                <th></th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map((product) => {
                const stock = getStock(product);
                return (
                <tr
                  key={product.id}
                  className={selectedIds.has(product.id) ? styles.selectedRow : ""}
                >
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      aria-label={`Select ${product.title}`}
                    />
                  </td>
                  <td>
                    <img
                      src={product.image}
                      alt={product.title}
                      className={styles.thumbnail}
                    />
                  </td>
                  <td className={styles.titleCell}>{product.title}</td>
                  <td>
                    <span className={styles.categoryBadge}>{product.category}</span>
                  </td>
                  <td className={styles.price}>${product.price.toFixed(2)}</td>
                  <td>
                    {stock === null ? (
                      <span className={styles.stockUntracked}>—</span>
                    ) : stock === 0 ? (
                      <span className={styles.stockOut}>Out of stock</span>
                    ) : stock <= 5 ? (
                      <span className={styles.stockLow}>{stock} left</span>
                    ) : (
                      <span className={styles.stockOk}>{stock} in stock</span>
                    )}
                  </td>
                  <td className={styles.actions}>
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className={styles.editButton}
                      title="Edit"
                      aria-label={`Edit ${product.title}`}
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className={styles.deleteButton}
                      disabled={deletingId === product.id}
                      title="Delete"
                      aria-label={`Delete ${product.title}`}
                    >
                      {deletingId === product.id ? "⏳" : "🗑️"}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
          />
        </div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {pageProducts.map((product) => {
              const stock = getStock(product);
              return (
              <div
                key={product.id}
                className={`${styles.card} ${selectedIds.has(product.id) ? styles.cardSelected : ""}`}
              >
                <div className={styles.cardCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelected(product.id)}
                    aria-label={`Select ${product.title}`}
                  />
                </div>
                <div className={styles.cardImageWrap}>
                  <img src={product.image} alt={product.title} className={styles.cardImage} />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.categoryBadge}>{product.category}</span>
                  <p className={styles.cardTitle}>{product.title}</p>
                  <p className={styles.cardPrice}>${product.price.toFixed(2)}</p>
                  {stock !== null && (
                    <span
                      className={
                        stock === 0
                          ? styles.stockOut
                          : stock <= 5
                            ? styles.stockLow
                            : styles.stockOk
                      }
                    >
                      {stock === 0 ? "Out of stock" : `${stock} in stock`}
                    </span>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className={styles.editButton}
                    title="Edit"
                    aria-label={`Edit ${product.title}`}
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(product)}
                    className={styles.deleteButton}
                    disabled={deletingId === product.id}
                    title="Delete"
                    aria-label={`Delete ${product.title}`}
                  >
                    {deletingId === product.id ? "⏳" : "🗑️"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          <div className={styles.gridPaginationWrap}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProductsPage;
