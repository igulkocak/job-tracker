import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>JobTrackr</div>
        <h1 className={styles.heading}>Create account</h1>
        <p className={styles.subheading}>Start tracking your job hunt</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Full name</label>
          <input className={styles.input} type="text" name="name" placeholder="Alex Rivera" value={form.name} onChange={handleChange} required />

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
