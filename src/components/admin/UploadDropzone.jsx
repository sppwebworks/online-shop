import React, { useRef, useState } from "react";
import { uploadService } from "../../services/uploadService";
import styles from "./UploadDropzone.module.css";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Drag-and-drop (or click-to-browse) image upload box. Reports the
// resulting URL via `onUploaded` — callers decide what to do with it
// (replace a single value, or append to a gallery array).
const UploadDropzone = ({ onUploaded, previewUrl }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
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
      onUploaded(url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    processFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className={styles.dropzoneThumb} />
        ) : (
          <span className={styles.dropzoneIcon}>⬆️</span>
        )}
        <button
          type="button"
          className={styles.uploadButton}
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        <p className={styles.dropzoneText}>
          Drop your image here, or click to browse
        </p>
        <p className={styles.dropzoneHint}>PNG, JPG, WebP or GIF — up to 5MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={isUploading}
          className={styles.hiddenFileInput}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default UploadDropzone;
