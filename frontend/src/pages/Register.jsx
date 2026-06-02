import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "elderly", label: "👴 I need support", desc: "Elderly user" },
  { value: "family", label: "👨‍👩‍👧 I care for someone", desc: "Family member" },
  { value: "volunteer", label: "🤝 I want to help", desc: "Volunteer" },
];

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", password: "", role: "", linkedElderlyId: "", language: "hi",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.role) return setError("Please select your role");

    const result = await register(form);
    if (result.success) {
      navigate(`/${result.user.role}`);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🤝</div>
        <h1 style={styles.title}>Join Saarthi</h1>
        <p style={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} type="text" placeholder="Your name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input style={styles.input} type="tel" placeholder="+91 98765 43210"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>I am a...</label>
            <div style={styles.roleGrid}>
              {ROLES.map((r) => (
                <button key={r.value} type="button"
                  style={{ ...styles.roleBtn, ...(form.role === r.value ? styles.roleBtnActive : {}) }}
                  onClick={() => setForm({ ...form, role: r.value })}>
                  <span style={{ fontSize: "20px" }}>{r.label.split(" ")[0]}</span>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {form.role === "family" && (
            <div style={styles.field}>
              <label style={styles.label}>Elderly Person's User ID</label>
              <input style={styles.input} type="text" placeholder="Their Saarthi User ID"
                value={form.linkedElderlyId}
                onChange={(e) => setForm({ ...form, linkedElderlyId: e.target.value })} required />
              <p style={styles.hint}>Ask the elderly person to share their ID from their profile</p>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already registered?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #6C47FF 0%, #4F2FCC 100%)", padding: "20px",
  },
  card: {
    background: "#fff", borderRadius: "24px", padding: "36px",
    width: "100%", maxWidth: "420px", textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  logo: { fontSize: "40px", marginBottom: "6px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#1A202C", margin: "0 0 4px" },
  subtitle: { fontSize: "14px", color: "#718096", marginBottom: "28px" },
  form: { textAlign: "left" },
  field: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#4A5568", marginBottom: "6px" },
  input: {
    width: "100%", padding: "11px 14px", border: "2px solid #E2E8F0",
    borderRadius: "10px", fontSize: "14px", outline: "none",
  },
  hint: { fontSize: "12px", color: "#718096", marginTop: "4px" },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
  roleBtn: {
    padding: "12px 8px", border: "2px solid #E2E8F0", borderRadius: "10px",
    background: "#F7F8FC", cursor: "pointer", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "4px", transition: "all 0.2s",
  },
  roleBtnActive: { border: "2px solid #6C47FF", background: "#EDE9FF" },
  error: { color: "#E53E3E", fontSize: "13px", marginBottom: "12px", textAlign: "center" },
  btn: {
    width: "100%", padding: "14px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600",
    marginTop: "8px", cursor: "pointer",
  },
  footer: { marginTop: "20px", fontSize: "14px", color: "#718096" },
  link: { color: "#6C47FF", fontWeight: "600" },
};

export default Register;
