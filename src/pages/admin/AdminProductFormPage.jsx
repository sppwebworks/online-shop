import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { productService } from "../../services/productService";
import ProductForm from "../../components/admin/ProductForm";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import styles from "./AdminProductFormPage.module.css";

const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const {
    data: product,
    loading,
    error,
  } = useFetch(
    (signal) =>
      isEditMode
        ? productService.getProductById(id, signal)
        : Promise.resolve(null),
    [id],
  );

  const handleSubmit = async (values) => {
    if (isEditMode) {
      await productService.updateProduct(id, values);
    } else {
      await productService.createProduct(values);
    }
    navigate("/admin/products");
  };

  if (isEditMode && loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (isEditMode && error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.page}>
      <Link to="/admin/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditMode ? "Edit Product" : "Add Product"}
        </h1>
        <p className={styles.subtitle}>
          {isEditMode
            ? "Update the details below and save your changes."
            : "Fill in the details below to list a new product."}
        </p>
      </div>

      <ProductForm
        initialProduct={product}
        onSubmit={handleSubmit}
        submitLabel={isEditMode ? "Save Changes" : "Create Product"}
      />
    </div>
  );
};

export default AdminProductFormPage;
