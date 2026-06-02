import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(form.phone, form.password);
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
        <h1 style={styles.title}>Saarthi</h1>
        <p style={styles.subtitle}>Your trusted companion</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input
              style={styles.input}
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          New user?{" "}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
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
    background: "#fff", borderRadius: "24px", padding: "40px 36px",
    width: "100%", maxWidth: "400px", textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  logo: { fontSize: "48px", marginBottom: "8px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1A202C", margin: "0 0 4px" },
  subtitle: { fontSize: "15px", color: "#718096", marginBottom: "32px" },
  form: { textAlign: "left" },
  field: { marginBottom: "16px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#4A5568", marginBottom: "6px" },
  input: {
    width: "100%", padding: "12px 16px", border: "2px solid #E2E8F0",
    borderRadius: "10px", fontSize: "15px", outline: "none",
    transition: "border 0.2s",
  },
  error: { color: "#E53E3E", fontSize: "14px", marginBottom: "12px", textAlign: "center" },
  btn: {
    width: "100%", padding: "14px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600",
    marginTop: "8px", cursor: "pointer", transition: "background 0.2s",
  },
  footer: { marginTop: "24px", fontSize: "14px", color: "#718096" },
  link: { color: "#6C47FF", fontWeight: "600" },
};

export default Login;
