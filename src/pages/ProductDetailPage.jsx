import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { productService } from "../services/productService";
import ProductDetails from "../components/products/ProductDetails";
import styles from "./ProductDetailPage.module.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const [relatedProducts, setRelatedProducts] = useState([]);

  const {
    data: product,
    loading,
    error,
  } = useFetch((signal) => productService.getProductById(id, signal), [id]);

  // Fetch related products (same category)
  useEffect(() => {
    if (product?.category) {
      const fetchRelated = async () => {
        try {
          const products = await productService.getProductsByCategory(
            product.category,
          );
          // Filter out current product and limit to 4
          const filtered = products.filter((p) => p.id !== id).slice(0, 4);
          setRelatedProducts(filtered);
        } catch (err) {
          console.error("Error fetching related products:", err);
        }
      };
      fetchRelated();
    }
  }, [product, id]);

  useEffect(() => {
    if (product) {
      document.title = `${product.title} - ProductsApp`;
    }
    return () => {
      document.title = "ProductsApp";
    };
  }, [product]);

  return (
    <div className={styles.container}>
      <ProductDetails
        product={product}
        loading={loading}
        error={error}
        relatedProducts={relatedProducts}
      />
    </div>
  );
};

export default ProductDetailPage;
