import { categoryApi } from "../api/categoryApi";

// Thin pass-through over categoryApi. The old version of this file carried
// a localStorage overlay (renames, custom categories, hidden flags) on top
// of fakestoreapi.com's read-only category list. With a real database,
// every category — seeded or admin-created — is just a row the backend
// manages directly, including rename propagation and product counts.
export const categoryService = {
  getAllCategories: (signal) => categoryApi.getAllCategories(signal),

  addCategory: ({ name, image }) =>
    categoryApi.createCategory({ name, image }),

  updateCategory: (category, { name, image }) =>
    categoryApi.updateCategory(category.id, { name, image }),

  toggleVisibility: (category) =>
    categoryApi.updateCategory(category.id, { hidden: !category.hidden }),

  removeCategory: (category) => categoryApi.deleteCategory(category.id),
};
