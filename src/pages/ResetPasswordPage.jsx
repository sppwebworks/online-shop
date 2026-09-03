import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import styles from "./LoginPage.module.css";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password Reset</h1>
          <div className={styles.success}>
            Your password has been changed. Redirecting to sign in...
          </div>
          <p className={styles.hint}>
            <Link to="/login">Sign in now</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Choose a new password for your account</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label} htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />

        <label className={styles.label} htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>

        <p className={styles.hint}>
          <Link to="/login">Back to Sign In</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
