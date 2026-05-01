import { useState, useEffect } from "react";
import styles from "./JobForm.module.css";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const EMPTY = { company: "", position: "", status: "Applied", location: "", url: "", notes: "", nextStep: "", salary: { min: "", max: "", currency: "USD" } };

export default function JobForm({ job, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (job) {
      setForm({
        company: job.company || "",
        position: job.position || "",
        status: job.status || "Applied",
        location: job.location || "",
        url: job.url || "",
        notes: job.notes || "",
        nextStep: job.nextStep || "",
        salary: { min: job.salary?.min ?? "", max: job.salary?.max ?? "", currency: job.salary?.currency || "USD" },
      });
    } else {
      setForm(EMPTY);
    }
  }, [job]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setSalary = (key, val) => setForm((f) => ({ ...f, salary: { ...f.salary, [key]: val } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, salary: { min: form.salary.min ? Number(form.salary.min) : undefined, max: form.salary.max ? Number(form.salary.max) : undefined, currency: form.salary.currency } };
    if (!payload.salary.min && !payload.salary.max) delete payload.salary;
    onSubmit(payload);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{job ? "Edit application" : "Add application"}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Company *</label>
              <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Google" required />
            </div>
            <div className={styles.field}>
              <label>Position *</label>
              <input value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Senior Engineer" required />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Remote / New York" />
            </div>
          </div>

          <div className={styles.field}>
            <label>Job URL</label>
            <input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://jobs.example.com/..." />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Salary min</label>
              <input type="number" value={form.salary.min} onChange={(e) => setSalary("min", e.target.value)} placeholder="80000" min="0" />
            </div>
            <div className={styles.field}>
              <label>Salary max</label>
              <input type="number" value={form.salary.max} onChange={(e) => setSalary("max", e.target.value)} placeholder="120000" min="0" />
            </div>
          </div>

          <div className={styles.field}>
            <label>Next step</label>
            <input value={form.nextStep} onChange={(e) => set("nextStep", e.target.value)} placeholder="e.g. Send thank-you email, Prepare for technical round" />
          </div>

          <div className={styles.field}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Recruiter name, contact info, impressions..." />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Saving..." : job ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
