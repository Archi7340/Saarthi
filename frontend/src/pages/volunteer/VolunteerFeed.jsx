import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import useSocketEvent from "../../hooks/useSocket";
import useGeoLocation from "../../hooks/useGeoLocation";
import api from "../../api/axios.config";

const CATEGORY_EMOJI = {
  medicine: "💊", grocery: "🛒", doctor: "🏥", technical: "📱", other: "🙋",
};
const CATEGORY_LABEL = {
  medicine: "Medicine Help", grocery: "Grocery Help",
  doctor: "Doctor Visit", technical: "Tech Help", other: "Other Help",
};

const VolunteerFeed = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { coordinates } = useGeoLocation();

  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState("");
  const [sosAlert, setSosAlert] = useState(null);

  // Fetch open nearby requests on load
  const fetchNearby = async () => {
    try {
      const url = coordinates
        ? `/requests/nearby?lng=${coordinates[0]}&lat=${coordinates[1]}&radius=10`
        : `/requests/nearby`;
      const { data } = await api.get(url);
      setRequests(data.requests);
    } catch (err) {
      console.error("fetchNearby error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNearby(); }, [coordinates]);

  // Update volunteer location via socket every 30s
  useEffect(() => {
    if (!socket || !coordinates) return;
    socket.emit("location:update", { coordinates });
    const interval = setInterval(() => {
      socket.emit("location:update", { coordinates });
    }, 30000);
    return () => clearInterval(interval);
  }, [socket, coordinates]);

  // Also update via REST as backup
  useEffect(() => {
    if (!coordinates) return;
    api.patch("/volunteers/location", { coordinates }).catch(console.error);
  }, [coordinates]);

  // New help request arrives via socket
  const handleNewRequest = useCallback((data) => {
    console.log("[Volunteer] request:new received", data);
    setRequests((prev) => {
      const exists = prev.find((r) => r._id === data.requestId);
      if (exists) return prev;
      return [{
        _id: data.requestId,
        category: data.category,
        description: data.description,
        elderlyId: { name: data.elderlyName, phone: data.elderlyPhone },
        coordinates: data.coordinates,
        mapsLink: data.mapsLink,
        status: "open",
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      }, ...prev];
    });
  }, []);

  // SOS alert arrives via socket
  const handleSOSAlert = useCallback((data) => {
    console.log("[Volunteer] sos:alert-volunteer received", data);
    setSosAlert(data);
  }, []);

  useSocketEvent("request:new", handleNewRequest);
  useSocketEvent("sos:alert-volunteer", handleSOSAlert);

  const toggleAvailability = async () => {
    try {
      const { data } = await api.patch("/volunteers/availability");
      setIsAvailable(data.isAvailable);
      if (socket) socket.emit("volunteer:available", { isAvailable: data.isAvailable });
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (requestId) => {
    setAccepting(requestId);
    try {
      await api.patch(`/requests/${requestId}/accept`);
      navigate(`/volunteer/task/${requestId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept. May already be taken.");
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } finally {
      setAccepting("");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Saarthi Volunteer</h1>
          <p style={styles.subtitle}>Welcome, {user?.name}</p>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* Availability toggle */}
      <div style={styles.availCard}>
        <div>
          <p style={styles.availTitle}>{isAvailable ? "🟢 Available for requests" : "🔴 Not available"}</p>
          <p style={styles.availSub}>Tasks completed: {user?.tasksCompleted || 0}</p>
        </div>
        <button
          style={{ ...styles.availBtn, background: isAvailable ? "#FED7D7" : "#C6F6D5",
            color: isAvailable ? "#C53030" : "#276749" }}
          onClick={toggleAvailability}
        >
          {isAvailable ? "Go Offline" : "Go Online"}
        </button>
      </div>

      {/* SOS Alert */}
      {sosAlert && (
        <div style={styles.sosBanner}>
          <div>
            <p style={styles.sosTitle}>🚨 EMERGENCY NEARBY</p>
            <p style={styles.sosName}>{sosAlert.elderlyName} needs emergency help!</p>

            {/* Elder contact */}
            {sosAlert.elderlyPhone && (
              <a href={`tel:${sosAlert.elderlyPhone}`} style={styles.callLink}>
                📞 Call {sosAlert.elderlyPhone}
              </a>
            )}
          </div>
          <div style={styles.sosActions}>
            <a href={sosAlert.mapsLink} target="_blank" rel="noreferrer" style={styles.mapsBtn}>
              📍 View Location
            </a>
            <button style={styles.dismissBtn} onClick={() => setSosAlert(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Nearby requests */}
      <h2 style={styles.sectionTitle}>Nearby Help Requests</h2>

      {loading ? (
        <p style={styles.loading}>Finding requests near you...</p>
      ) : requests.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: "40px" }}>🔍</span>
          <p style={{ color: "#718096", marginTop: "12px" }}>No requests nearby right now</p>
          <p style={{ color: "#A0AEC0", fontSize: "13px" }}>New requests will appear here automatically</p>
        </div>
      ) : (
        <div style={styles.list}>
          {requests.map((req) => {
            const elder = req.elderlyId || {};
            return (
              <div key={req._id} style={styles.reqCard}>
                <div style={styles.reqTop}>
                  <span style={{ fontSize: "28px" }}>{CATEGORY_EMOJI[req.category] || "🙋"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={styles.reqCategory}>{CATEGORY_LABEL[req.category] || "Help needed"}</p>
                    {req.description && <p style={styles.reqDesc}>"{req.description}"</p>}
                  </div>
                </div>

                {/* Elder info card */}
                <div style={styles.elderInfo}>
                  <span style={{ fontSize: "18px" }}>👴</span>
                  <div style={{ flex: 1 }}>
                    <p style={styles.elderName}>{elder.name || req.elderlyName || "Elder"}</p>
                    {(elder.phone || req.elderlyPhone) && (
                      <a
                        href={`tel:${elder.phone || req.elderlyPhone}`}
                        style={styles.elderPhone}
                      >
                        📞 {elder.phone || req.elderlyPhone}
                      </a>
                    )}
                  </div>
                  {req.mapsLink && (
                    <a href={req.mapsLink} target="_blank" rel="noreferrer" style={styles.miniMapBtn}>
                      📍 Map
                    </a>
                  )}
                </div>

                <div style={styles.reqMeta}>
                  <span style={styles.reqTime}>
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "Just now"}
                  </span>
                  {req.expiresAt && (
                    <span style={styles.expiry}>
                      Expires {new Date(req.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <button
                  style={styles.acceptBtn}
                  onClick={() => acceptRequest(req._id)}
                  disabled={accepting === req._id || req.status !== "open"}
                >
                  {accepting === req._id ? "Accepting..." : "✅ Accept & Help"}
                </button>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1A202C" },
  subtitle: { fontSize: "13px", color: "#718096" },
  logoutBtn: { padding: "7px 14px", background: "transparent", border: "1.5px solid #E2E8F0",
    borderRadius: "8px", fontSize: "13px", color: "#718096", cursor: "pointer" },
  availCard: { background: "#fff", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  availTitle: { fontSize: "14px", fontWeight: "600", color: "#2D3748" },
  availSub: { fontSize: "12px", color: "#718096", marginTop: "2px" },
  availBtn: { padding: "8px 14px", border: "none", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  sosBanner: { background: "#E53E3E", borderRadius: "14px", padding: "16px",
    marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  sosTitle: { fontSize: "16px", fontWeight: "800", color: "#fff" },
  sosName: { fontSize: "14px", color: "rgba(255,255,255,0.95)", margin: "4px 0 8px" },
  callLink: { display: "inline-block", background: "rgba(255,255,255,0.25)", color: "#fff",
    padding: "7px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "600",
    textDecoration: "none", marginBottom: "8px" },
  sosActions: { display: "flex", gap: "8px" },
  mapsBtn: { padding: "7px 14px", background: "rgba(255,255,255,0.2)", color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "8px", fontSize: "13px",
    fontWeight: "600", textDecoration: "none" },
  dismissBtn: { padding: "7px 14px", background: "none", color: "rgba(255,255,255,0.7)",
    border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" },
  sectionTitle: { fontSize: "17px", fontWeight: "700", color: "#1A202C", marginBottom: "12px" },
  loading: { color: "#718096", textAlign: "center", marginTop: "32px" },
  empty: { textAlign: "center", marginTop: "48px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  reqCard: { background: "#fff", borderRadius: "14px", padding: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  reqTop: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" },
  reqCategory: { fontSize: "15px", fontWeight: "600", color: "#1A202C" },
  reqDesc: { fontSize: "12px", color: "#718096", marginTop: "2px", fontStyle: "italic" },
  elderInfo: { background: "#F7F8FC", borderRadius: "10px", padding: "10px 12px",
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  elderName: { fontSize: "13px", fontWeight: "600", color: "#2D3748" },
  elderPhone: { fontSize: "13px", color: "#6C47FF", fontWeight: "600",
    textDecoration: "none", display: "block", marginTop: "2px" },
  miniMapBtn: { padding: "5px 10px", background: "#EDE9FF", color: "#4F2FCC",
    borderRadius: "8px", fontSize: "12px", fontWeight: "600", textDecoration: "none", flexShrink: 0 },
  reqMeta: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  reqTime: { fontSize: "12px", color: "#718096" },
  expiry: { fontSize: "12px", color: "#DD6B20", fontWeight: "500" },
  acceptBtn: { width: "100%", padding: "12px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
};

export default VolunteerFeed;