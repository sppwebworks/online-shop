import React, { useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import { productService } from "../services/productService";
import ProductList from "../components/products/ProductList";
import styles from "./ProductsPage.module.css";

const ProductsPage = () => {
  const {
    data: products,
    loading,
    error,
  } = useFetch((signal) => productService.getVisibleProducts(signal));

  useEffect(() => {
    document.title = "Products - ProductsApp";
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Our Products</h1>
      <p className={styles.subtitle}>Fresh picks across every category</p>
      <ProductList products={products} loading={loading} error={error} />
    </div>
  );
};

export default ProductsPage;
