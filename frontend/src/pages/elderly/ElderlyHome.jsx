import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useSocketEvent from "../../hooks/useSocket";
import useGeoLocation from "../../hooks/useGeoLocation";
import api from "../../api/axios.config";
import MedicineAckOverlay from "../../components/MedicineAckOverlay";

const HELP_CATEGORIES = [
  { key: "medicine", emoji: "💊", label: "Medicine Help" },
  { key: "grocery", emoji: "🛒", label: "Grocery Help" },
  { key: "doctor", emoji: "🏥", label: "Doctor Visit" },
  { key: "technical", emoji: "📱", label: "Tech Help" },
  { key: "other", emoji: "🙋", label: "Other Help" },
];

const ElderlyHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { coordinates } = useGeoLocation();
  const [sosLoading, setSosLoading] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [requestLoading, setRequestLoading] = useState("");
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Listen for volunteer accepted event
  const handleRequestStatus = useCallback((data) => {
    showNotification(`✅ ${data.volunteerName} is coming to help you!`, "success");
  }, []);

  // Listen for medicine reminder
  const handleMedReminder = useCallback((data) => {
    showNotification(`💊 Time to take ${data.medicineName} — ${data.dosage}`, "warning");
  }, []);

  useSocketEvent("request:status", handleRequestStatus);
  useSocketEvent("med:reminder", handleMedReminder);

  const triggerSOS = async () => {
    const coords = coordinates || [75.7873, 26.9124]; // fallback if GPS unavailable
    setSosLoading(true);
    try {
      await api.post("/sos/trigger", { coordinates: coords });
      setSosTriggered(true);
      showNotification("🚨 Emergency alert sent! Help is on the way.", "success");
      setTimeout(() => setSosTriggered(false), 10000);
    } catch (err) {
      showNotification("Failed to send SOS. Please call your family directly.", "error");
    } finally {
      setSosLoading(false);
    }
  };

  const sendHelpRequest = async (category) => {
    const coords = coordinates || [75.7873, 26.9124]; // fallback if GPS unavailable
    setRequestLoading(category);
    try {
      await api.post("/requests", { category, coordinates: coords });
      showNotification("✅ Help request sent! A volunteer will reach out soon.", "success");
    } catch (err) {
      showNotification("Failed to send request. Please try again.", "error");
    } finally {
      setRequestLoading("");
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>Namaste 🙏</p>
          <h1 style={styles.name}>{user?.name}</h1>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* Notification banner */}
      {notification && (
        <div style={{
          ...styles.notification,
          background: notification.type === "success" ? "#C6F6D5"
            : notification.type === "warning" ? "#FEFCBF" : "#FED7D7",
          color: notification.type === "success" ? "#276749"
            : notification.type === "warning" ? "#744210" : "#9B2335",
        }}>
          {notification.msg}
        </div>
      )}

      {/* SOS Button */}
      <button
        style={{ ...styles.sosBtn, ...(sosTriggered ? styles.sosBtnActive : {}) }}
        onClick={triggerSOS}
        disabled={sosLoading}
        aria-label="Emergency SOS Button"
      >
        <span style={styles.sosIcon}>🆘</span>
        <span style={styles.sosText}>
          {sosLoading ? "Sending Alert..." : sosTriggered ? "Help is Coming!" : "SOS Emergency"}
        </span>
        <span style={styles.sosHint}>Press for emergency help</span>
      </button>

      {/* Help Categories */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>I Need Help With...</p>
        <div style={styles.categoryGrid}>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              style={styles.categoryBtn}
              onClick={() => sendHelpRequest(cat.key)}
              disabled={requestLoading === cat.key}
              aria-label={cat.label}
            >
              <span style={styles.catEmoji}>{cat.emoji}</span>
              <span style={styles.catLabel}>
                {requestLoading === cat.key ? "Sending..." : cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View my requests */}
      <button style={styles.trackBtn} onClick={() => navigate("/elderly/requests")}>
        📋 View My Requests
      </button>

      {/* Medicine reminder overlay — floats above everything */}
      <MedicineAckOverlay />
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#F7F8FC", padding: "20px", maxWidth: "480px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  greeting: { fontSize: "15px", color: "#718096" },
  name: { fontSize: "24px", fontWeight: "700", color: "#1A202C" },
  logoutBtn: { padding: "8px 14px", background: "transparent", border: "1.5px solid #E2E8F0",
    borderRadius: "8px", fontSize: "13px", color: "#718096", cursor: "pointer" },
  notification: { borderRadius: "12px", padding: "14px 16px", fontSize: "15px", fontWeight: "500",
    marginBottom: "16px", lineHeight: "1.4" },
  sosBtn: {
    width: "100%", padding: "32px 20px",
    background: "linear-gradient(135deg, #E53E3E, #C53030)",
    border: "none", borderRadius: "20px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
    boxShadow: "0 8px 24px rgba(229,62,62,0.4)", marginBottom: "28px",
    transition: "transform 0.1s, box-shadow 0.2s",
  },
  sosBtnActive: {
    background: "linear-gradient(135deg, #276749, #22543D)",
    boxShadow: "0 8px 24px rgba(39,103,73,0.4)",
  },
  sosIcon: { fontSize: "52px" },
  sosText: { fontSize: "26px", fontWeight: "800", color: "#fff", letterSpacing: "-0.5px" },
  sosHint: { fontSize: "14px", color: "rgba(255,255,255,0.8)" },
  section: { marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#1A202C", marginBottom: "12px" },
  categoryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  categoryBtn: {
    padding: "20px 12px", background: "#fff", border: "2px solid #E2E8F0",
    borderRadius: "16px", cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s",
  },
  catEmoji: { fontSize: "32px" },
  catLabel: { fontSize: "15px", fontWeight: "600", color: "#2D3748" },
  trackBtn: {
    width: "100%", padding: "16px", background: "#EDE9FF", color: "#4F2FCC",
    border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "600",
    cursor: "pointer",
  },
};

export default ElderlyHome;