import { productApi } from "../api/productApi";

// Thin pass-through over productApi. This used to carry a localStorage
// overlay that faked persistence on top of the read-only fakestoreapi.com —
// now that products live in a real database, the backend is the source of
// truth and this layer just exists to keep page components decoupled from
// the raw API module.
export const productService = {
  getAllProducts: (signal) => productApi.getAllProducts(signal),
  getVisibleProducts: (signal) => productApi.getVisibleProducts(signal),
  getProductsByCategory: (category, signal) =>
    productApi.getProductsByCategory(category, signal),
  getProductById: (id, signal) => productApi.getProductById(id, signal),
  createProduct: (productData) => productApi.createProduct(productData),
  updateProduct: (id, productData) =>
    productApi.updateProduct(id, productData),
  deleteProduct: (id) => productApi.deleteProduct(id),
};
