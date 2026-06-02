import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useSocketEvent from "../../hooks/useSocket";
import api from "../../api/axios.config";

const STATUS_COLORS = {
  open: { bg: "#EBF8FF", text: "#2B6CB0", label: "⏳ Waiting for volunteer" },
  accepted: { bg: "#C6F6D5", text: "#276749", label: "✅ Volunteer coming" },
  completed: { bg: "#E9D8FD", text: "#553C9A", label: "🎉 Completed" },
  expired: { bg: "#FED7D7", text: "#9B2335", label: "❌ Expired" },
};

const CATEGORY_EMOJI = {
  medicine: "💊", grocery: "🛒", doctor: "🏥", technical: "📱", other: "🙋",
};

const RequestStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get(`/requests/elderly/${user._id}`);
      setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Update status in real time
  const handleStatusUpdate = useCallback((data) => {
    setRequests((prev) =>
      prev.map((r) => r._id === data.requestId ? { ...r, status: data.status, acceptedBy: { name: data.volunteerName } } : r)
    );
  }, []);

  useSocketEvent("request:status", handleStatusUpdate);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/elderly")}>← Back</button>
        <h1 style={styles.title}>My Requests</h1>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading your requests...</p>
      ) : requests.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: "48px" }}>📋</span>
          <p style={{ fontSize: "16px", color: "#718096", marginTop: "12px" }}>No requests yet</p>
        </div>
      ) : (
        <div style={styles.list}>
          {requests.map((req) => {
            const s = STATUS_COLORS[req.status] || STATUS_COLORS.open;
            return (
              <div key={req._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={{ fontSize: "28px" }}>{CATEGORY_EMOJI[req.category]}</span>
                  <div style={{ flex: 1 }}>
                    <p style={styles.category}>{req.category.charAt(0).toUpperCase() + req.category.slice(1)} Help</p>
                    <p style={styles.time}>{new Date(req.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div style={{ ...styles.statusBadge, background: s.bg, color: s.text }}>
                  {s.label}
                </div>
                {req.acceptedBy && (
                  <p style={styles.volunteerInfo}>👤 {req.acceptedBy.name} is helping you</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#F7F8FC", padding: "20px", maxWidth: "480px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  backBtn: { background: "none", border: "none", fontSize: "16px", color: "#6C47FF", cursor: "pointer", fontWeight: "600" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1A202C" },
  loading: { textAlign: "center", color: "#718096", marginTop: "40px", fontSize: "16px" },
  empty: { textAlign: "center", marginTop: "60px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: { background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  category: { fontSize: "16px", fontWeight: "600", color: "#1A202C" },
  time: { fontSize: "12px", color: "#718096" },
  statusBadge: { borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", display: "inline-block" },
  volunteerInfo: { fontSize: "14px", color: "#276749", marginTop: "8px", fontWeight: "500" },
};

export default RequestStatus;
