import React, { useState } from "react";
import UploadDropzone from "./UploadDropzone";
import styles from "./ImageGalleryInput.module.css";

// A product's photo gallery: any number of images, added by URL or upload,
// removable, reorderable enough to pick a new primary/cover shot (always
// images[0]). `images` / `onChange(nextImages)` is the array of URLs.
const ImageGalleryInput = ({ images, onChange }) => {
  const [mode, setMode] = useState("url");
  const [urlDraft, setUrlDraft] = useState("");

  const addImage = (url) => {
    if (!url) return;
    onChange([...images, url]);
  };

  const handleAddUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    addImage(url);
    setUrlDraft("");
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const makePrimary = (index) => {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  };

  return (
    <div className={styles.container}>
      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((img, index) => (
            <div key={`${img}-${index}`} className={styles.thumb}>
              <img src={img} alt="" className={styles.thumbImage} />
              {index === 0 && <span className={styles.primaryBadge}>Primary</span>}
              <div className={styles.thumbActions}>
                {index !== 0 && (
                  <button
                    type="button"
                    className={styles.thumbActionButton}
                    onClick={() => makePrimary(index)}
                    title="Make primary"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  className={styles.thumbActionButton}
                  onClick={() => removeImage(index)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.addPanel}>
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

        {mode === "url" ? (
          <div className={styles.urlRow}>
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://..."
              className={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
            />
            <button type="button" className={styles.addButton} onClick={handleAddUrl}>
              Add
            </button>
          </div>
        ) : (
          <UploadDropzone onUploaded={addImage} />
        )}
      </div>
    </div>
  );
};

export default ImageGalleryInput;
