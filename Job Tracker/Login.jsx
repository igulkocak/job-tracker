import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>JobTrackr</div>
        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your account</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
