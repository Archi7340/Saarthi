import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios.config";

const MedicineManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const elderlyId = user?.linkedElderlyId;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medicineName: "", dosage: "", times: ["08:00"] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get(`/medicine/${elderlyId}`);
      setSchedules(data.schedules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (elderlyId) fetchSchedules(); }, [elderlyId]);

  const addTime = () => setForm({ ...form, times: [...form.times, "12:00"] });
  const removeTime = (i) => setForm({ ...form, times: form.times.filter((_, idx) => idx !== i) });
  const updateTime = (i, val) => {
    const updated = [...form.times];
    updated[i] = val;
    setForm({ ...form, times: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/medicine", { ...form, elderlyId });
      setForm({ medicineName: "", dosage: "", times: ["08:00"] });
      setShowForm(false);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSchedule = async (id) => {
    try {
      await api.patch(`/medicine/${id}/toggle`);
      fetchSchedules();
    } catch (err) { console.error(err); }
  };

  const deleteSchedule = async (id) => {
    if (!confirm("Delete this medicine schedule?")) return;
    try {
      await api.delete(`/medicine/${id}`);
      fetchSchedules();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/family")}>← Dashboard</button>
        <h1 style={styles.title}>Medicine Schedules</h1>
      </div>

      <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
        {showForm ? "✕ Cancel" : "+ Add Medicine"}
      </button>

      {/* Add form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Medicine Schedule</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Medicine Name</label>
              <input style={styles.input} placeholder="e.g. Metformin 500mg"
                value={form.medicineName}
                onChange={(e) => setForm({ ...form, medicineName: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Dosage</label>
              <input style={styles.input} placeholder="e.g. 1 tablet, 5ml"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Reminder Times</label>
              {form.times.map((t, i) => (
                <div key={i} style={styles.timeRow}>
                  <input style={{ ...styles.input, flex: 1 }} type="time" value={t}
                    onChange={(e) => updateTime(i, e.target.value)} />
                  {form.times.length > 1 && (
                    <button type="button" style={styles.removeTimeBtn} onClick={() => removeTime(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" style={styles.addTimeBtn} onClick={addTime}>+ Add Time</button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.submitBtn} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Schedule"}
            </button>
          </form>
        </div>
      )}

      {/* Schedules list */}
      {loading ? <p style={styles.loading}>Loading schedules...</p> :
       schedules.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: "40px" }}>💊</span>
          <p style={{ color: "#718096", marginTop: "12px" }}>No medicine schedules yet</p>
        </div>
      ) : (
        <div style={styles.list}>
          {schedules.map((s) => (
            <div key={s._id} style={{ ...styles.scheduleCard, opacity: s.isActive ? 1 : 0.6 }}>
              <div style={styles.scheduleTop}>
                <div>
                  <p style={styles.medName}>{s.medicineName}</p>
                  <p style={styles.dosage}>{s.dosage}</p>
                </div>
                <div style={styles.scheduleActions}>
                  <button style={{
                    ...styles.toggleBtn,
                    background: s.isActive ? "#C6F6D5" : "#E2E8F0",
                    color: s.isActive ? "#276749" : "#718096",
                  }} onClick={() => toggleSchedule(s._id)}>
                    {s.isActive ? "Active" : "Paused"}
                  </button>
                  <button style={styles.deleteBtn} onClick={() => deleteSchedule(s._id)}>🗑️</button>
                </div>
              </div>
              <div style={styles.timesRow}>
                {s.times.map((t, i) => (
                  <span key={i} style={styles.timePill}>🕐 {t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#F7F8FC", padding: "20px", maxWidth: "480px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" },
  backBtn: { background: "none", border: "none", fontSize: "14px", color: "#6C47FF", cursor: "pointer", fontWeight: "600" },
  title: { fontSize: "20px", fontWeight: "700", color: "#1A202C" },
  addBtn: { width: "100%", padding: "13px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600",
    cursor: "pointer", marginBottom: "16px" },
  formCard: { background: "#fff", borderRadius: "16px", padding: "20px", marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
  formTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#1A202C" },
  field: { marginBottom: "14px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#4A5568", marginBottom: "5px" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0",
    borderRadius: "8px", fontSize: "14px", outline: "none" },
  timeRow: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" },
  removeTimeBtn: { padding: "8px 10px", background: "#FED7D7", color: "#C53030",
    border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer" },
  addTimeBtn: { background: "none", border: "1.5px dashed #CBD5E0", borderRadius: "8px",
    padding: "8px 14px", fontSize: "13px", color: "#718096", cursor: "pointer", marginTop: "4px" },
  error: { color: "#E53E3E", fontSize: "13px", marginBottom: "10px" },
  submitBtn: { width: "100%", padding: "12px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  loading: { color: "#718096", textAlign: "center", marginTop: "32px" },
  empty: { textAlign: "center", marginTop: "48px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  scheduleCard: { background: "#fff", borderRadius: "14px", padding: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  scheduleTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
  medName: { fontSize: "16px", fontWeight: "700", color: "#1A202C" },
  dosage: { fontSize: "13px", color: "#718096", marginTop: "2px" },
  scheduleActions: { display: "flex", alignItems: "center", gap: "8px" },
  toggleBtn: { padding: "5px 10px", border: "none", borderRadius: "6px",
    fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  deleteBtn: { background: "none", border: "none", fontSize: "16px", cursor: "pointer" },
  timesRow: { display: "flex", flexWrap: "wrap", gap: "6px" },
  timePill: { background: "#EDE9FF", color: "#4F2FCC", borderRadius: "6px",
    padding: "4px 10px", fontSize: "12px", fontWeight: "500" },
};

export default MedicineManager;
