import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import useSocketEvent from "../../hooks/useSocket";
import api from "../../api/axios.config";

const FamilyDashboard = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  // linkedElderlyId may be stored as object or string — normalise it
  const elderlyId = user?.linkedElderlyId?._id
    ? user.linkedElderlyId._id.toString()
    : user?.linkedElderlyId?.toString() || null;

  const [requests, setRequests] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missedMeds, setMissedMeds] = useState([]);
  const [elderlyIdError, setElderlyIdError] = useState(false);
  const [medAckNotifs, setMedAckNotifs] = useState([]);

  const fetchData = async () => {
    if (!elderlyId) {
      setElderlyIdError(true);
      setLoading(false);
      return;
    }
    try {
      const [reqRes, sosRes] = await Promise.all([
        api.get(`/requests/elderly/${elderlyId}`),
        api.get(`/sos/history/${elderlyId}`),
      ]);
      setRequests(reqRes.data.requests);
      setSosAlerts(sosRes.data.alerts);
    } catch (err) {
      console.error("fetchData error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (elderlyId) fetchData(); }, [elderlyId]);

  // Re-fetch whenever socket reconnects — catches events missed while offline
  const [prevConnected, setPrevConnected] = useState(false);
  useEffect(() => {
    if (connected && !prevConnected && elderlyId) {
      // Was offline, now back online — refresh everything from DB
      fetchData();
      fetchMedicineAcks();
    }
    setPrevConnected(connected);
  }, [connected]);

  // Fetch today's medicine acknowledgements from DB
  const fetchMedicineAcks = async () => {
    if (!elderlyId) return;
    try {
      const { data } = await api.get(`/medicine/${elderlyId}`);
      const today = new Date().toISOString().split("T")[0];

      // Get list of already-dismissed ack keys from sessionStorage
      const dismissedRaw = sessionStorage.getItem("saarthi_dismissed_acks");
      const dismissed = dismissedRaw ? JSON.parse(dismissedRaw) : [];

      const todayAcks = [];
      data.schedules.forEach((s) => {
        s.acknowledgements
          .filter((a) => a.scheduledDate === today && a.takenAt)
          .forEach((a) => {
            const key = `${s._id}-${a.scheduledTime}-${today}`;
            if (!dismissed.includes(key)) {
              todayAcks.push({
                key,
                medicineName: s.medicineName,
                dosage: s.dosage,
                scheduledTime: a.scheduledTime,
                takenAt: a.takenAt,
              });
            }
          });
      });
      if (todayAcks.length > 0) {
        setMedAckNotifs(todayAcks.slice(0, 5));
      }
    } catch (err) {
      console.error("fetchMedicineAcks error:", err.message);
    }
  };

  // Fetch acks on initial load too
  useEffect(() => { if (elderlyId) fetchMedicineAcks(); }, [elderlyId]);

  // Real-time SOS alert
  const handleSOSAlert = useCallback((data) => {
    setActiveAlert(data);
  }, []);

  const handleSOSResolved = useCallback(() => {
    setActiveAlert(null);
    fetchData();
  }, []);

  const handleRequestStatus = useCallback((data) => {
    setRequests((prev) =>
      prev.map((r) => r._id === data.requestId ? { ...r, status: data.status } : r)
    );
  }, []);

  const handleMedMissed = useCallback((data) => {
    setMissedMeds((prev) => [data, ...prev]);
  }, []);

  // ← NEW: listen for medicine acknowledged by elderly
  const handleMedAcknowledged = useCallback((data) => {
    const today = new Date().toISOString().split("T")[0];
    const key = `${data.scheduleId}-${data.scheduledTime}-${today}`;
    const dismissed = JSON.parse(sessionStorage.getItem("saarthi_dismissed_acks") || "[]");
    if (dismissed.includes(key)) return; // already dismissed
    setMedAckNotifs((prev) => [{ ...data, key }, ...prev.slice(0, 4)]);
  }, []);

  useSocketEvent("sos:alert-family", handleSOSAlert);
  useSocketEvent("sos:resolved", handleSOSResolved);
  useSocketEvent("request:status", handleRequestStatus);
  useSocketEvent("med:missed", handleMedMissed);
  useSocketEvent("med:acknowledged", handleMedAcknowledged); // ← NEW

  const resolveSOS = async (alertId) => {
    try {
      await api.patch(`/sos/${alertId}/resolve`);
      setActiveAlert(null);
    } catch (err) {
      console.error(err);
    }
  };

  const activeRequests = requests.filter((r) => r.status === "open" || r.status === "accepted");
  const recentRequests = requests.slice(0, 5);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Family Dashboard</h1>
          <p style={styles.subtitle}>Monitoring {user?.name?.split(" ")[0]}'s family member</p>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* elderlyId missing — account setup issue */}
      {elderlyIdError && (
        <div style={styles.errorBanner}>
          <p style={{ fontWeight: "600", marginBottom: "4px" }}>⚠️ No elderly account linked</p>
          <p style={{ fontSize: "13px" }}>
            Your account is not linked to an elderly user. Please log out and register again,
            entering the correct elderly person's User ID.
          </p>
          <p style={{ fontSize: "12px", marginTop: "8px", color: "#744210" }}>
            Elderly User ID can be found in their profile. Their MongoDB _id starts with a 24-character string.
          </p>
        </div>
      )}

      {/* Active SOS Banner */}
      {activeAlert && (
        <div style={styles.sosBanner}>
          <div style={styles.sosPulse}>🚨</div>
          <div style={{ flex: 1 }}>
            <p style={styles.sosTitle}>EMERGENCY ALERT</p>
            <p style={styles.sosDetail}>{activeAlert.elderlyName} needs help!</p>
            <a href={activeAlert.mapsLink} target="_blank" rel="noreferrer" style={styles.mapsLink}>
              📍 View Location on Maps
            </a>
          </div>
          <button style={styles.resolveBtn} onClick={() => resolveSOS(activeAlert.alertId)}>
            Mark Resolved
          </button>
        </div>
      )}

      {/* Missed medicine alerts */}
      {missedMeds.length > 0 && (
        <div style={styles.medAlert}>
          <p style={styles.medAlertText}>
            ⚠️ {missedMeds[0].elderlyName} missed {missedMeds[0].medicineName} at {missedMeds[0].scheduledTime}
          </p>
          <button style={styles.clearBtn} onClick={() => setMissedMeds([])}>Dismiss</button>
        </div>
      )}

      {/* Medicine acknowledged notifications */}
      {medAckNotifs.length > 0 && (
        <div style={styles.ackBanner}>
          <div style={styles.ackIcon}>💊✅</div>
          <div style={{ flex: 1 }}>
            <p style={styles.ackTitle}>Medicine Taken</p>
            <p style={styles.ackDetail}>
              {medAckNotifs[0].medicineName} ({medAckNotifs[0].dosage}) taken at {medAckNotifs[0].scheduledTime}
            </p>
          </div>
          <button style={styles.clearBtn} onClick={() => {
            // Save all current ack keys as dismissed in sessionStorage
            const keys = medAckNotifs.map(n => n.key).filter(Boolean);
            const existing = JSON.parse(sessionStorage.getItem("saarthi_dismissed_acks") || "[]");
            sessionStorage.setItem("saarthi_dismissed_acks", JSON.stringify([...new Set([...existing, ...keys])]));
            setMedAckNotifs([]);
          }}>✕</button>
        </div>
      )}

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{activeRequests.length}</span>
          <span style={styles.statLabel}>Active Requests</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{sosAlerts.filter(a => a.status === "active").length}</span>
          <span style={styles.statLabel}>Active SOS</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{requests.filter(r => r.status === "completed").length}</span>
          <span style={styles.statLabel}>Completed</span>
        </div>
      </div>

      {/* Medicine manager link */}
      <button style={styles.medBtn} onClick={() => navigate("/family/medicine")}>
        💊 Manage Medicine Schedules
      </button>

      {/* Recent requests */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Requests</h2>
        {loading ? <p style={styles.loading}>Loading...</p> :
         recentRequests.length === 0 ? <p style={styles.empty}>No requests yet</p> :
          recentRequests.map((req) => (
            <div key={req._id} style={styles.reqCard}>
              <div style={styles.reqTop}>
                <span style={styles.reqCategory}>{req.category} help</span>
                <span style={{
                  ...styles.reqStatus,
                  color: req.status === "completed" ? "#276749" : req.status === "accepted" ? "#2B6CB0" : "#C05621"
                }}>
                  {req.status}
                </span>
              </div>
              {req.acceptedBy && (
                <p style={styles.reqVolunteer}>👤 {req.acceptedBy.name}</p>
              )}
              <p style={styles.reqTime}>{new Date(req.createdAt).toLocaleString("en-IN")}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#F7F8FC", padding: "20px", maxWidth: "640px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title: { fontSize: "22px", fontWeight: "700", color: "#1A202C" },
  subtitle: { fontSize: "13px", color: "#718096", marginTop: "2px" },
  logoutBtn: { padding: "7px 14px", background: "transparent", border: "1.5px solid #E2E8F0",
    borderRadius: "8px", fontSize: "13px", color: "#718096", cursor: "pointer" },
  sosBanner: {
    background: "#E53E3E", borderRadius: "16px", padding: "16px", marginBottom: "16px",
    display: "flex", alignItems: "center", gap: "14px",
  },
  sosPulse: { fontSize: "32px" },
  sosTitle: { fontSize: "16px", fontWeight: "800", color: "#fff" },
  sosDetail: { fontSize: "14px", color: "rgba(255,255,255,0.9)" },
  mapsLink: { fontSize: "13px", color: "#FEB2B2", fontWeight: "600", display: "block", marginTop: "4px" },
  resolveBtn: { padding: "8px 14px", background: "rgba(255,255,255,0.2)", color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "8px", fontSize: "12px",
    fontWeight: "600", cursor: "pointer", flexShrink: 0 },
  medAlert: {
    background: "#FEFCBF", border: "1.5px solid #ECC94B", borderRadius: "12px",
    padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  medAlertText: { fontSize: "13px", color: "#744210", fontWeight: "500" },
  clearBtn: { background: "none", border: "none", fontSize: "12px", color: "#744210", cursor: "pointer", fontWeight: "600" },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" },
  statCard: {
    background: "#fff", borderRadius: "14px", padding: "16px", textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "4px",
  },
  statNum: { fontSize: "28px", fontWeight: "800", color: "#6C47FF" },
  statLabel: { fontSize: "11px", color: "#718096", fontWeight: "500" },
  medBtn: {
    width: "100%", padding: "14px", background: "#EDE9FF", color: "#4F2FCC",
    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600",
    cursor: "pointer", marginBottom: "20px",
  },
  section: { marginBottom: "20px" },
  sectionTitle: { fontSize: "17px", fontWeight: "700", color: "#1A202C", marginBottom: "10px" },
  loading: { color: "#718096", fontSize: "14px" },
  empty: { color: "#718096", fontSize: "14px" },
  reqCard: { background: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)" },
  reqTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  reqCategory: { fontSize: "14px", fontWeight: "600", color: "#2D3748", textTransform: "capitalize" },
  reqStatus: { fontSize: "12px", fontWeight: "600", textTransform: "capitalize" },
  reqVolunteer: { fontSize: "13px", color: "#276749" },
  reqTime: { fontSize: "11px", color: "#718096", marginTop: "4px" },
  errorBanner: {
    background: "#FEFCBF", border: "1.5px solid #ECC94B", borderRadius: "12px",
    padding: "14px 16px", marginBottom: "16px", color: "#744210",
  },
  ackBanner: {
    background: "#C6F6D5", border: "1.5px solid #9AE6B4", borderRadius: "12px",
    padding: "12px 16px", marginBottom: "16px",
    display: "flex", alignItems: "center", gap: "12px",
  },
  ackIcon: { fontSize: "22px", flexShrink: 0 },
  ackTitle: { fontSize: "13px", fontWeight: "700", color: "#276749" },
  ackDetail: { fontSize: "13px", color: "#2F855A", marginTop: "2px" },
};

export default FamilyDashboard;