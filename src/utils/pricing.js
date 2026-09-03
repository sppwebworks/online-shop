// Real discount, derived from the product's own price/originalPrice fields —
// never a value invented for display purposes.
export const getDiscountPercent = (product) => {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  );
};

export const getProductColors = (product) =>
  new Set((product.variants || []).map((v) => v.color).filter(Boolean));
