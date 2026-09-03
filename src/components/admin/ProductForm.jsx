import React, { useEffect, useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { categoryService } from "../../services/categoryService";
import ImageGalleryInput from "./ImageGalleryInput";
import styles from "./ProductForm.module.css";

const emptyValues = {
  title: "",
  price: "",
  originalPrice: "",
  category: "",
  images: [],
  description: "",
  brand: "",
  weight: "",
  gender: "",
  sku: "",
  flatStock: "",
};

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const COLOR_OPTIONS = [
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "yellow", hex: "#eab308" },
  { name: "green", hex: "#22c55e" },
  { name: "blue", hex: "#3b82f6" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "white", hex: "#ffffff" },
  { name: "black", hex: "#111827" },
];

const variantKey = (size, color) => `${size}|${color}`;

const ProductForm = ({ initialProduct, onSubmit, submitLabel = "Save" }) => {
  const { data: categories } = useFetch((signal) =>
    categoryService.getAllCategories(signal),
  );
  const [values, setValues] = useState(emptyValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  // The size/color axes an admin has turned on, independent of the actual
  // stock/SKU numbers typed in — this is what makes toggling an axis on or
  // off a clean operation instead of patching a flat array in place.
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  // Stock/SKU entered per (size, color) combination, keyed by variantKey.
  // Entries here survive toggling axes on and off, so re-checking a size
  // you unchecked a moment ago doesn't lose what you typed.
  const [variantData, setVariantData] = useState({});
  // Optional photo set per color, keyed by color name. A color with no
  // entry (or an empty array) just falls back to the shared gallery above.
  const [colorImagesData, setColorImagesData] = useState({});

  useEffect(() => {
    if (initialProduct) {
      const variants = initialProduct.variants || [];
      const hasAxis = variants.some((v) => v.size || v.color);

      setValues({
        title: initialProduct.title || "",
        price: initialProduct.price ?? "",
        originalPrice: initialProduct.originalPrice ?? "",
        category: initialProduct.category || "",
        images:
          initialProduct.images && initialProduct.images.length > 0
            ? initialProduct.images
            : initialProduct.image
              ? [initialProduct.image]
              : [],
        description: initialProduct.description || "",
        brand: initialProduct.brand || "",
        weight: initialProduct.weight || "",
        gender: initialProduct.gender || "",
        sku: initialProduct.sku || "",
        flatStock: !hasAxis && variants[0] ? variants[0].stock : "",
      });

      if (hasAxis) {
        setSelectedSizes([...new Set(variants.map((v) => v.size))].filter(Boolean));
        setSelectedColors([...new Set(variants.map((v) => v.color))].filter(Boolean));
        const data = {};
        variants.forEach((v) => {
          data[variantKey(v.size, v.color)] = { sku: v.sku || "", stock: v.stock ?? 0 };
        });
        setVariantData(data);
      }

      const colorImageMap = {};
      (initialProduct.colorImages || []).forEach((c) => {
        colorImageMap[c.color] = c.images || [];
      });
      setColorImagesData(colorImageMap);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (!initialProduct && !values.category && categories?.length > 0) {
      setValues((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [initialProduct, categories, values.category]);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // The rendered/saved variant rows: the cartesian product of whichever
  // axes are turned on, each looked up in variantData for its stock/SKU
  // (defaulting to empty/0 the first time a combination appears).
  const computedVariants = useMemo(() => {
    if (selectedSizes.length === 0 && selectedColors.length === 0) return [];
    const sizes = selectedSizes.length > 0 ? selectedSizes : [""];
    const colors = selectedColors.length > 0 ? selectedColors : [""];
    const rows = [];
    sizes.forEach((size) => {
      colors.forEach((color) => {
        const data = variantData[variantKey(size, color)] || {};
        rows.push({ size, color, sku: data.sku || "", stock: data.stock ?? 0 });
      });
    });
    return rows;
  }, [selectedSizes, selectedColors, variantData]);

  const toggleSizeAxis = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const toggleColorAxis = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const updateVariantField = (size, color, field, value) => {
    const key = variantKey(size, color);
    setVariantData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const finalVariants =
        computedVariants.length > 0
          ? computedVariants.map((v) => ({ ...v, stock: parseInt(v.stock, 10) || 0 }))
          : [{ size: "", color: "", sku: values.sku, stock: parseInt(values.flatStock, 10) || 0 }];

      const finalColorImages = selectedColors
        .filter((color) => (colorImagesData[color] || []).length > 0)
        .map((color) => ({ color, images: colorImagesData[color] }));

      await onSubmit({
        title: values.title,
        price: parseFloat(values.price) || 0,
        originalPrice: values.originalPrice ? parseFloat(values.originalPrice) : null,
        category: values.category,
        image: values.images[0] || "",
        images: values.images,
        colorImages: finalColorImages,
        description: values.description,
        brand: values.brand,
        weight: values.weight,
        gender: values.gender,
        sku: values.sku,
        variants: finalVariants,
      });
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverImage = values.images[0];
  const priceDisplay = values.price
    ? `$${parseFloat(values.price).toFixed(2)}`
    : "$0.00";
  const originalPriceDisplay =
    values.originalPrice && parseFloat(values.originalPrice) > parseFloat(values.price || 0)
      ? `$${parseFloat(values.originalPrice).toFixed(2)}`
      : null;
  const totalStock =
    computedVariants.length > 0
      ? computedVariants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
      : parseInt(values.flatStock, 10) || 0;

  return (
    <form className={styles.layout} onSubmit={handleSubmit}>
      <aside className={styles.preview}>
        <p className={styles.previewLabel}>Live Preview</p>
        <div className={styles.previewCard}>
          <div className={styles.previewImageWrap}>
            {coverImage && !imageFailed ? (
              <img
                src={coverImage}
                alt={values.title || "Product preview"}
                className={styles.previewImage}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <span>🖼️</span>
                <span>No image yet</span>
              </div>
            )}
          </div>
          <div className={styles.previewBody}>
            {values.category && (
              <span className={styles.previewCategory}>{values.category}</span>
            )}
            <p className={styles.previewTitle}>
              {values.title || "Product title"}
            </p>
            {values.description && (
              <p className={styles.previewDescription}>{values.description}</p>
            )}
            <p className={styles.previewPriceRow}>
              <span className={styles.previewPrice}>{priceDisplay}</span>
              {originalPriceDisplay && (
                <span className={styles.previewOriginalPrice}>{originalPriceDisplay}</span>
              )}
            </p>
            {(values.brand || values.weight || values.gender) && (
              <p className={styles.previewMeta}>
                {[values.brand, values.weight, values.gender]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {selectedSizes.length > 0 && (
              <div className={styles.previewChips}>
                <span className={styles.previewChipsLabel}>Size:</span>
                {selectedSizes.map((s) => (
                  <span key={s} className={styles.previewSizeChip}>
                    {s}
                  </span>
                ))}
              </div>
            )}
            {selectedColors.length > 0 && (
              <div className={styles.previewChips}>
                <span className={styles.previewChipsLabel}>Colors:</span>
                {selectedColors.map((c) => (
                  <span
                    key={c}
                    className={styles.previewColorSwatch}
                    style={{ background: COLOR_OPTIONS.find((o) => o.name === c)?.hex || c }}
                    title={c}
                  />
                ))}
              </div>
            )}
            <p
              className={`${styles.previewStock} ${totalStock > 0 ? "" : styles.previewStockOut}`}
            >
              {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
            </p>
          </div>
        </div>
      </aside>

      <div className={styles.fields}>
        {formError && <div className={styles.formError}>{formError}</div>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Product Photos</h2>
          <ImageGalleryInput
            images={values.images}
            onChange={(images) => {
              setImageFailed(false);
              setValues((prev) => ({ ...prev, images }));
            }}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Product Information</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="title">
                Product Name
              </label>
              <input
                id="title"
                className={styles.input}
                value={values.title}
                onChange={handleChange("title")}
                placeholder="e.g. Wireless Headphones"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="category">
                Product Category
              </label>
              <select
                id="category"
                className={styles.input}
                value={values.category}
                onChange={handleChange("category")}
              >
                {(categories || []).map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                className={styles.input}
                value={values.brand}
                onChange={handleChange("brand")}
                placeholder="Brand name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="weight">
                Weight
              </label>
              <input
                id="weight"
                className={styles.input}
                value={values.weight}
                onChange={handleChange("weight")}
                placeholder="e.g. 500g"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                className={styles.input}
                value={values.gender}
                onChange={handleChange("gender")}
              >
                <option value="">Not specified</option>
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="price">
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className={styles.input}
                value={values.price}
                onChange={handleChange("price")}
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="originalPrice">
                Original Price (optional)
              </label>
              <input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                className={styles.input}
                value={values.originalPrice}
                onChange={handleChange("originalPrice")}
                placeholder="For showing a discount"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sku">
              SKU (optional)
            </label>
            <input
              id="sku"
              className={styles.input}
              value={values.sku}
              onChange={handleChange("sku")}
              placeholder="e.g. JCK-WNTR-001"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              rows={5}
              value={values.description}
              onChange={handleChange("description")}
              placeholder="Describe the product for customers..."
              required
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Variants &amp; Stock</h2>
          <p className={styles.hint}>
            Pick the sizes and colors this product comes in — each combination
            gets its own stock count, just like on Amazon or Flipkart. Leave
            both empty for a single product with no size/color options.
          </p>

          <div className={styles.field}>
            <span className={styles.label}>Size</span>
            <div className={styles.sizeGroup}>
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`${styles.sizeButton} ${
                    selectedSizes.includes(size) ? styles.sizeButtonActive : ""
                  }`}
                  onClick={() => toggleSizeAxis(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Colors</span>
            <div className={styles.colorGroup}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`${styles.colorButton} ${
                    selectedColors.includes(color.name) ? styles.colorButtonActive : ""
                  }`}
                  style={{ background: color.hex }}
                  onClick={() => toggleColorAxis(color.name)}
                  title={color.name}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          {selectedColors.length > 0 && (
            <div className={styles.field}>
              <span className={styles.label}>Photos per color (optional)</span>
              <p className={styles.hint}>
                Give a color its own photos so customers see that exact variant when they
                pick it — the "More Colors" section on the product page. Skip a color to
                just use the main photos above for it.
              </p>
              <div className={styles.colorPhotoGroups}>
                {selectedColors.map((color) => (
                  <div key={color} className={styles.colorPhotoGroup}>
                    <span className={styles.colorPhotoGroupLabel}>
                      <span
                        className={styles.variantColorDot}
                        style={{
                          background: COLOR_OPTIONS.find((o) => o.name === color)?.hex || color,
                        }}
                      />
                      {color}
                    </span>
                    <ImageGalleryInput
                      images={colorImagesData[color] || []}
                      onChange={(images) =>
                        setColorImagesData((prev) => ({ ...prev, [color]: images }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {computedVariants.length > 0 ? (
            <div className={styles.variantTableWrap}>
              <table className={styles.variantTable}>
                <thead>
                  <tr>
                    {selectedSizes.length > 0 && <th>Size</th>}
                    {selectedColors.length > 0 && <th>Color</th>}
                    <th>SKU</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {computedVariants.map((variant) => (
                    <tr key={variantKey(variant.size, variant.color)}>
                      {selectedSizes.length > 0 && (
                        <td className={styles.variantLabelCell}>{variant.size || "—"}</td>
                      )}
                      {selectedColors.length > 0 && (
                        <td>
                          {variant.color ? (
                            <span className={styles.variantColorCell}>
                              <span
                                className={styles.variantColorDot}
                                style={{
                                  background:
                                    COLOR_OPTIONS.find((o) => o.name === variant.color)?.hex ||
                                    variant.color,
                                }}
                              />
                              {variant.color}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      <td>
                        <input
                          type="text"
                          className={styles.variantInput}
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariantField(variant.size, variant.color, "sku", e.target.value)
                          }
                          placeholder="Optional"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className={styles.variantInput}
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariantField(
                              variant.size,
                              variant.color,
                              "stock",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="flatStock">
                Stock Quantity
              </label>
              <input
                id="flatStock"
                type="number"
                min="0"
                className={styles.input}
                value={values.flatStock}
                onChange={handleChange("flatStock")}
                placeholder="0"
              />
            </div>
          )}
        </section>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
