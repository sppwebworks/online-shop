import React, { useRef, useState } from "react";
import { uploadService } from "../../services/uploadService";
import styles from "./ReviewPhotoUpload.module.css";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 5;

// Real customer-uploaded photos on a review — same upload endpoint the
// admin panel uses, just triggered from the storefront. No stock/fake
// imagery, only what the reviewer actually attaches.
const ReviewPhotoUpload = ({ images, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 5MB");
      return;
    }

    setError("");
    setIsUploading(true);
    try {
      const { url } = await uploadService.uploadImage(file);
      onChange([...images, url]);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {images.map((img, index) => (
          <div key={img + index} className={styles.thumb}>
            <img src={img} alt="" className={styles.thumbImage} />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeImage(index)}
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "…" : "+"}
            <span>Add Photo</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className={styles.hiddenFileInput}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ReviewPhotoUpload;
