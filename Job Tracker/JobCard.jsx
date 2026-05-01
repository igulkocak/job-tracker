import styles from "./JobCard.module.css";

const STATUS_META = {
  Applied:   { color: "var(--status-applied)",   bg: "var(--status-applied-bg)"   },
  Interview: { color: "var(--status-interview)", bg: "var(--status-interview-bg)" },
  Offer:     { color: "var(--status-offer)",     bg: "var(--status-offer-bg)"     },
  Rejected:  { color: "var(--status-rejected)",  bg: "var(--status-rejected-bg)"  },
};

export default function JobCard({ job, onEdit, onDelete, onStatusChange }) {
  const meta = STATUS_META[job.status] || STATUS_META.Applied;

  const fmtSalary = () => {
    if (!job.salary?.min && !job.salary?.max) return null;
    const fmt = (n) => n ? `$${(n / 1000).toFixed(0)}k` : null;
    const parts = [fmt(job.salary.min), fmt(job.salary.max)].filter(Boolean);
    return parts.join(" – ");
  };

  const daysSince = () => {
    const diff = Math.floor((Date.now() - new Date(job.appliedAt)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff}d ago`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.initials}>{job.company.slice(0, 2).toUpperCase()}</div>
        <div className={styles.meta}>
          <h3 className={styles.position}>{job.position}</h3>
          <p className={styles.company}>{job.company}{job.location && <span className={styles.location}> · {job.location}</span>}</p>
        </div>
        <span className={styles.badge} style={{ color: meta.color, background: meta.bg }}>{job.status}</span>
      </div>

      {(fmtSalary() || job.nextStep) && (
        <div className={styles.details}>
          {fmtSalary() && <span className={styles.detail}>{fmtSalary()}</span>}
          {job.nextStep && <span className={styles.detail} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>→ {job.nextStep}</span>}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.time}>{daysSince()}</span>
        <div className={styles.actions}>
          <select
            className={styles.statusSelect}
            value={job.status}
            onChange={(e) => onStatusChange(job._id, e.target.value)}
            style={{ color: meta.color }}
          >
            {["Applied", "Interview", "Offer", "Rejected"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className={styles.btn} onClick={() => onEdit(job)}>Edit</button>
          <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => onDelete(job._id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
