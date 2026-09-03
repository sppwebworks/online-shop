const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    category: { type: String, required: true, lowercase: true, trim: true },
    image: { type: String, required: true },
    rating: {
      rate: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    originalPrice: { type: Number, default: null, min: 0 },
    brand: { type: String, default: "", trim: true },
    weight: { type: String, default: "", trim: true },
    gender: {
      type: String,
      enum: ["", "unisex", "men", "women"],
      default: "",
    },
    // Extra gallery images; `image` above stays the primary/cover shot
    // (always images[0]) so every existing bit of code that reads
    // `product.image` keeps working unchanged.
    images: { type: [String], default: [] },
    // Optional per-color photo sets — a color without an entry here just
    // falls back to the shared `images` gallery above. Keyed by color name
    // (not size, since size doesn't usually change how a product looks).
    colorImages: {
      type: [
        {
          color: { type: String, required: true },
          images: { type: [String], default: [] },
          _id: false,
        },
      ],
      default: [],
    },
    sku: { type: String, default: "", trim: true, uppercase: true },
    // Each combination of size/color (or a single "" / "" row for products
    // with no size or color axis) tracks its own stock, Amazon/Flipkart
    // style. Products created before this feature has an empty array here —
    // treated everywhere as "stock not tracked" for backward compatibility,
    // never as "out of stock".
    variants: {
      type: [
        {
          size: { type: String, default: "" },
          color: { type: String, default: "" },
          sku: { type: String, default: "" },
          stock: { type: Number, default: 0, min: 0 },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
