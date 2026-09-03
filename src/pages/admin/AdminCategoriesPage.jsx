import React, { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { usePagination } from "../../hooks/usePagination";
import { categoryService } from "../../services/categoryService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/admin/StatCard";
import Pagination from "../../components/admin/Pagination";
import ImageInput from "../../components/admin/ImageInput";
import styles from "./AdminCategoriesPage.module.css";

const PAGE_SIZE = 8;

const emptyForm = { name: "", image: "" };

const AdminCategoriesPage = () => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [view, setView] = useState("table");

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useFetch((signal) => categoryService.getAllCategories(signal));

  const stats = useMemo(() => {
    if (!categories) return { total: 0, visible: 0, hidden: 0 };
    const hidden = categories.filter((c) => c.hidden).length;
    return { total: categories.length, visible: categories.length - hidden, hidden };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const term = searchTerm.toLowerCase().trim();
    return categories.filter((c) => {
      const matchesTerm = !term || c.name.toLowerCase().includes(term);
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && !c.hidden) ||
        (visibilityFilter === "hidden" && c.hidden);
      return matchesTerm && matchesVisibility;
    });
  }, [categories, searchTerm, visibilityFilter]);

  const {
    page,
    setPage,
    totalPages,
    pageItems: pageCategories,
    totalItems,
  } = usePagination(filteredCategories, PAGE_SIZE);

  const resetToFirstPage = () => setPage(1);

  const isEditing = Boolean(editingCategory);

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormValues({
      name: category.name,
      image: category.autoImage ? "" : category.image || "",
    });
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormValues(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await categoryService.updateCategory(editingCategory, formValues);
      } else {
        await categoryService.addCategory(formValues);
      }
      setFormValues(emptyForm);
      setEditingCategory(null);
      refetchCategories();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (category) => {
    if (!window.confirm(`Remove category "${category.name}"?`)) return;
    try {
      await categoryService.removeCategory(category);
      refetchCategories();
    } catch (err) {
      window.alert(err.message || "Failed to remove category");
    }
  };

  const handleToggleVisibility = async (category) => {
    try {
      await categoryService.toggleVisibility(category);
      refetchCategories();
    } catch (err) {
      window.alert(err.message || "Failed to update category");
    }
  };

  if (categoriesLoading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (categoriesError) {
    return <div className={styles.error}>Error: {categoriesError}</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Categories</h1>
      <p className={styles.subtitle}>
        Manage the categories products can be listed under.
      </p>

      <div className={styles.grid}>
        <StatCard icon="🏷️" label="Total Categories" value={stats.total} accent="indigo" />
        <StatCard icon="👁️" label="Visible" value={stats.visible} accent="green" />
        <StatCard icon="🙈" label="Hidden" value={stats.hidden} accent="amber" />
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>
          {isEditing ? "Edit Category" : "New Category"}
        </h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryName">
            Name
          </label>
          <input
            id="categoryName"
            type="text"
            placeholder="e.g. sports equipment"
            value={formValues.name}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, name: e.target.value }))
            }
            className={styles.input}
          />
        </div>

        <div className={styles.imageField}>
          <ImageInput
            label="Image (optional)"
            value={formValues.image}
            onChange={(url) => setFormValues((prev) => ({ ...prev, image: url }))}
          />
        </div>

        {formError && <div className={styles.formError}>{formError}</div>}
        <div className={styles.formActions}>
          {isEditing && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "+ Add Category"}
          </button>
        </div>
      </form>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search categories..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
          className={styles.searchInput}
        />

        <select
          value={visibilityFilter}
          onChange={(e) => {
            setVisibilityFilter(e.target.value);
            resetToFirstPage();
          }}
          className={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
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
      </div>

      {filteredCategories.length === 0 ? (
        <div className={styles.noResultsStandalone}>No categories found</div>
      ) : view === "table" ? (
        <div className={styles.listWrapper}>
          <table className={styles.list}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Products</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageCategories.map((category) => (
                <tr
                  key={category.id}
                  className={category.hidden ? styles.hiddenRow : ""}
                >
                  <td>
                    <div className={styles.thumbWrap}>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className={styles.thumb}
                        />
                      ) : (
                        <span className={styles.thumbPlaceholder}>🏷️</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.nameCell}>{category.name}</td>
                  <td>{category.productCount}</td>
                  <td>
                    <span
                      className={
                        category.hidden
                          ? styles.statusHidden
                          : styles.statusVisible
                      }
                    >
                      {category.hidden ? "Hidden" : "Visible"}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => startEdit(category)}
                      className={styles.editButton}
                      title="Edit"
                      aria-label={`Edit ${category.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(category)}
                      className={styles.visibilityButton}
                      title={category.hidden ? "Show" : "Hide"}
                      aria-label={category.hidden ? `Show ${category.name}` : `Hide ${category.name}`}
                    >
                      {category.hidden ? "👁️" : "🙈"}
                    </button>
                    <button
                      onClick={() => handleRemove(category)}
                      className={styles.removeButton}
                      title="Remove"
                      aria-label={`Remove ${category.name}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
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
            {pageCategories.map((category) => (
              <div
                key={category.id}
                className={`${styles.card} ${category.hidden ? styles.cardHidden : ""}`}
              >
                <div className={styles.cardImageWrap}>
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className={styles.cardImage}
                    />
                  ) : (
                    <span className={styles.thumbPlaceholder}>🏷️</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardName}>{category.name}</p>
                  <p className={styles.cardMeta}>{category.productCount} products</p>
                  <span
                    className={
                      category.hidden ? styles.statusHidden : styles.statusVisible
                    }
                  >
                    {category.hidden ? "Hidden" : "Visible"}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => startEdit(category)}
                    className={styles.editButton}
                    title="Edit"
                    aria-label={`Edit ${category.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(category)}
                    className={styles.visibilityButton}
                    title={category.hidden ? "Show" : "Hide"}
                    aria-label={category.hidden ? `Show ${category.name}` : `Hide ${category.name}`}
                  >
                    {category.hidden ? "👁️" : "🙈"}
                  </button>
                  <button
                    onClick={() => handleRemove(category)}
                    className={styles.removeButton}
                    title="Remove"
                    aria-label={`Remove ${category.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
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

export default AdminCategoriesPage;
