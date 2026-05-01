import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { jobsAPI } from "../api";
import JobCard from "../components/JobCard";
import JobForm from "../components/JobForm";
import styles from "./Dashboard.module.css";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      params.sortBy = sortBy;
      params.order = "desc";
      const { data } = await jobsAPI.getAll(params);
      setJobs(data.data);
      setStats(data.stats);
    } catch {
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchJobs, search]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await jobsAPI.create(formData);
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.msg || "Failed to create job.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await jobsAPI.update(editingJob._id, formData);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await jobsAPI.remove(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      fetchJobs();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await jobsAPI.updateStatus(id, status);
      setJobs((prev) => prev.map((j) => j._id === id ? { ...j, status } : j));
      fetchJobs();
    } catch {
      alert("Failed to update status.");
    }
  };

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>JobTrackr</div>

        <div className={styles.stats}>
          <div className={styles.totalCount}>{Object.values(stats).reduce((a, b) => a + b, 0)}</div>
          <div className={styles.totalLabel}>Applications</div>
          <div className={styles.statGrid}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`${styles.statItem} ${filterStatus === s ? styles.activeFilter : ""}`}
                onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              >
                <span className={styles.statCount} data-status={s}>{stats[s] || 0}</span>
                <span className={styles.statLabel}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.name?.slice(0, 1).toUpperCase()}</div>
            <span className={styles.userName}>{user?.name}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className={styles.search}
                placeholder="Search by company or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className={styles.sort} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Newest</option>
              <option value="appliedAt">Date applied</option>
              <option value="company">Company A–Z</option>
              <option value="status">Status</option>
            </select>
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>
            + Add application
          </button>
        </div>

        {filterStatus && (
          <div className={styles.filterTag}>
            Filtered: {filterStatus}
            <button onClick={() => setFilterStatus("")}>✕</button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.empty}>Loading applications...</div>
        ) : jobs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No applications found</p>
            <span>{search || filterStatus ? "Try adjusting your search or filter" : "Click "+ Add application" to get started"}</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onEdit={(j) => setEditingJob(j)}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {(showForm || editingJob) && (
        <JobForm
          job={editingJob}
          onSubmit={editingJob ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingJob(null); }}
          loading={formLoading}
        />
      )}
    </div>
  );
}
