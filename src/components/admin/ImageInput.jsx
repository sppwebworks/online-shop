import React, { useState } from "react";
import UploadDropzone from "./UploadDropzone";
import styles from "./ImageInput.module.css";

// Lets an admin set a single image either by pasting a URL or uploading a
// file — their choice, toggled with the two tabs. Both paths end the same
// way: `onChange` receives a plain URL string.
const ImageInput = ({ value, onChange, label = "Image" }) => {
  const [mode, setMode] = useState("url");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${mode === "url" ? styles.tabActive : ""}`}
            onClick={() => setMode("url")}
          >
            Paste URL
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === "upload" ? styles.tabActive : ""}`}
            onClick={() => setMode("upload")}
          >
            Upload File
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div className={styles.urlBody}>
          {value && (
            <img
              src={value}
              alt=""
              className={styles.preview}
              onError={(e) => (e.target.style.visibility = "hidden")}
            />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className={styles.input}
          />
        </div>
      ) : (
        <UploadDropzone onUploaded={onChange} previewUrl={value} />
      )}
    </div>
  );
};

export default ImageInput;
