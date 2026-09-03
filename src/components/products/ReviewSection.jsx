import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { reviewService } from "../../services/reviewService";
import ReviewPhotoUpload from "./ReviewPhotoUpload";
import styles from "./ReviewSection.module.css";

const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const FIT_LABELS = {
  small: "Runs Small",
  true_to_size: "Just Right",
  large: "Runs Large",
};

const StarPicker = ({ value, onChange }) => (
  <div className={styles.starPicker}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        className={styles.starButton}
        onClick={() => onChange(n)}
        aria-label={`${n} star${n !== 1 ? "s" : ""}`}
      >
        {n <= value ? "★" : "☆"}
      </button>
    ))}
  </div>
);

// A real, functioning review system tied to the logged-in customer's own
// account — one review per user per product (resubmitting edits it), no
// fabricated reviews, ratings, or fit-feedback percentages. Submitting
// recomputes the product's aggregate rating server-side, but that top
// summary elsewhere on the page only reflects it after the next full page
// load — acceptable staleness for the size of this feature.
const ReviewSection = ({ productId }) => {
  const { user, isAuthenticated } = useAdminAuth();
  const {
    data: reviews,
    loading,
    error,
    refetch,
  } = useFetch((signal) => reviewService.getProductReviews(productId, signal), [productId]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [fit, setFit] = useState("");
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const myReview = reviews?.find((r) => r.user === user?.id);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
      setFit(myReview.fit || "");
      setImages(myReview.images || []);
    }
  }, [myReview?.id]);

  const summary = React.useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { avg: 0, count: 0, breakdown: [0, 0, 0, 0, 0], fitCounts: {} };
    }
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const breakdown = [5, 4, 3, 2, 1].map(
      (star) => reviews.filter((r) => r.rating === star).length,
    );
    const fitCounts = reviews.reduce((acc, r) => {
      if (r.fit) acc[r.fit] = (acc[r.fit] || 0) + 1;
      return acc;
    }, {});
    return {
      avg: Math.round((total / reviews.length) * 10) / 10,
      count: reviews.length,
      breakdown,
      fitCounts,
    };
  }, [reviews]);

  const fitTotal = Object.values(summary.fitCounts).reduce((a, b) => a + b, 0);
  const allPhotos = React.useMemo(
    () => (reviews || []).flatMap((r) => (r.images || []).map((img) => ({ img, review: r }))),
    [reviews],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      await reviewService.submitReview(productId, { rating, comment, fit, images });
      setIsEditing(false);
      refetch();
    } catch (err) {
      setFormError(err.message || "Could not submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await reviewService.deleteMyReview(productId);
      setRating(5);
      setComment("");
      setFit("");
      setImages([]);
      refetch();
    } catch (err) {
      window.alert(err.message || "Could not delete review");
    }
  };

  if (loading) return null;
  if (error) return null;

  const showForm = isAuthenticated && (!myReview || isEditing);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Ratings &amp; Reviews</h2>

      <div className={styles.summaryPanel}>
        <div className={styles.summaryLeft}>
          <span className={styles.summaryAvg}>{summary.avg || "—"}</span>
          <span className={styles.summaryStar}>★</span>
          <span className={styles.summaryCount}>
            {summary.count} review{summary.count !== 1 ? "s" : ""}
          </span>
        </div>

        {summary.count > 0 && (
          <div className={styles.histogram}>
            {[5, 4, 3, 2, 1].map((star, i) => (
              <div key={star} className={styles.histogramRow}>
                <span className={styles.histogramLabel}>{star} ★</span>
                <div className={styles.histogramTrack}>
                  <div
                    className={styles.histogramFill}
                    style={{ width: `${(summary.breakdown[i] / summary.count) * 100}%` }}
                  />
                </div>
                <span className={styles.histogramCount}>{summary.breakdown[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {fitTotal > 0 && (
        <div className={styles.fitSummary}>
          <span className={styles.fitSummaryLabel}>What customers said about fit</span>
          <div className={styles.fitTags}>
            {Object.entries(summary.fitCounts).map(([key, count]) => (
              <span key={key} className={styles.fitTag}>
                {FIT_LABELS[key]} ({Math.round((count / fitTotal) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {allPhotos.length > 0 && (
        <div className={styles.photoStrip}>
          <span className={styles.photoStripLabel}>Customer Photos ({allPhotos.length})</span>
          <div className={styles.photoStripRow}>
            {allPhotos.map(({ img, review }, index) => (
              <img
                key={img + index}
                src={img}
                alt={`${review.userName}'s photo`}
                className={styles.photoStripImage}
              />
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <p className={styles.empty}>No reviews yet — be the first to review this product.</p>
      )}

      <div className={styles.list}>
        {reviews
          .filter((r) => r.id !== myReview?.id)
          .map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <span className={styles.avatar}>{initials(review.userName)}</span>
                <div>
                  <p className={styles.reviewerName}>{review.userName}</p>
                  <p className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className={styles.reviewStars}>{"★".repeat(review.rating)}</span>
              </div>
              {review.fit && <span className={styles.reviewFitTag}>{FIT_LABELS[review.fit]}</span>}
              <p className={styles.reviewComment}>{review.comment}</p>
              {review.images?.length > 0 && (
                <div className={styles.reviewImages}>
                  {review.images.map((img, i) => (
                    <img key={img + i} src={img} alt="" className={styles.reviewImage} />
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {isAuthenticated ? (
        myReview && !isEditing ? (
          <div className={styles.myReviewCard}>
            <div className={styles.reviewHeader}>
              <span className={styles.avatar}>{initials(myReview.userName)}</span>
              <div>
                <p className={styles.reviewerName}>Your review</p>
                <p className={styles.reviewDate}>
                  {new Date(myReview.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={styles.reviewStars}>{"★".repeat(myReview.rating)}</span>
            </div>
            {myReview.fit && (
              <span className={styles.reviewFitTag}>{FIT_LABELS[myReview.fit]}</span>
            )}
            <p className={styles.reviewComment}>{myReview.comment}</p>
            {myReview.images?.length > 0 && (
              <div className={styles.reviewImages}>
                {myReview.images.map((img, i) => (
                  <img key={img + i} src={img} alt="" className={styles.reviewImage} />
                ))}
              </div>
            )}
            <div className={styles.myReviewActions}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button type="button" className={styles.deleteButton} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        ) : showForm ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h3 className={styles.formTitle}>
              {myReview ? "Edit your review" : "Write a review"}
            </h3>
            {formError && <div className={styles.formError}>{formError}</div>}
            <StarPicker value={rating} onChange={setRating} />

            <div className={styles.fitPicker}>
              {["small", "true_to_size", "large"].map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.fitOption} ${fit === key ? styles.fitOptionActive : ""}`}
                  onClick={() => setFit(fit === key ? "" : key)}
                >
                  {FIT_LABELS[key]}
                </button>
              ))}
            </div>

            <textarea
              className={styles.textarea}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              required
            />

            <ReviewPhotoUpload images={images} onChange={setImages} />

            <div className={styles.formActions}>
              {myReview && (
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        ) : null
      ) : (
        <p className={styles.signInPrompt}>
          <Link to="/login">Sign in</Link> to write a review.
        </p>
      )}
    </div>
  );
};

export default ReviewSection;
