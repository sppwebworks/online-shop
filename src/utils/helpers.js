// Utility functions

export const formatPrice = (price) => {
  return `$${parseFloat(price).toFixed(2)}`;
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const getCategoryColor = (category) => {
  const colors = {
    electronics: "#3b82f6",
    jewelery: "#f59e0b",
    "men's clothing": "#8b5cf6",
    "women's clothing": "#ec4899",
  };
  return colors[category] || "#6b7280";
};
