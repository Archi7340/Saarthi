import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios.config";

const CATEGORY_EMOJI = {
  medicine: "💊", grocery: "🛒", doctor: "🏥", technical: "📱", other: "🙋",
};

const ActiveTask = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        // Fetch all elderly requests to find this one
        // In production, add a GET /requests/:id endpoint
        const { data } = await api.get(`/requests/nearby?lng=0&lat=0&radius=99999`);
        const found = data.requests?.find((r) => r._id === requestId);
        if (found) setRequest(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const completeTask = async () => {
    setCompleting(true);
    try {
      await api.patch(`/requests/${requestId}/complete`);
      setCompleted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div style={styles.centered}>
      <p style={{ color: "#718096" }}>Loading task details...</p>
    </div>
  );

  if (completed) return (
    <div style={styles.centered}>
      <div style={styles.successCard}>
        <span style={{ fontSize: "56px" }}>🎉</span>
        <h2 style={styles.successTitle}>Task Completed!</h2>
        <p style={styles.successMsg}>Thank you for helping. Your kindness makes a difference.</p>
        <button style={styles.backBtn} onClick={() => navigate("/volunteer")}>
          Back to Feed
        </button>
      </div>
    </div>
  );

  const elderly = request?.elderlyId || {};

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.navBack} onClick={() => navigate("/volunteer")}>← Back</button>
        <h1 style={styles.title}>Active Task</h1>
      </div>

      {/* Task card */}
      <div style={styles.taskCard}>
        <div style={styles.taskIcon}>{CATEGORY_EMOJI[request?.category] || "🙋"}</div>
        <h2 style={styles.taskTitle}>
          {request?.category ? request.category.charAt(0).toUpperCase() + request.category.slice(1) : "Help"} Request
        </h2>
        {request?.description && (
          <p style={styles.taskDesc}>"{request.description}"</p>
        )}
        <div style={styles.statusBadge}>✅ You accepted this task</div>
      </div>

      {/* Contact info */}
      {elderly.name && (
        <div style={styles.contactCard}>
          <h3 style={styles.contactTitle}>Contact the Elderly Person</h3>
          <div style={styles.contactRow}>
            <span style={{ fontSize: "20px" }}>👴</span>
            <div>
              <p style={styles.contactName}>{elderly.name}</p>
              {elderly.phone && (
                <a href={`tel:${elderly.phone}`} style={styles.callBtn}>
                  📞 Call {elderly.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Steps guide */}
      <div style={styles.stepsCard}>
        <h3 style={styles.stepsTitle}>What to do</h3>
        <div style={styles.step}><span style={styles.stepNum}>1</span><span>Call the person to confirm the help needed</span></div>
        <div style={styles.step}><span style={styles.stepNum}>2</span><span>Go to their location and assist them</span></div>
        <div style={styles.step}><span style={styles.stepNum}>3</span><span>Once done, press Complete Task below</span></div>
      </div>

      {/* Complete button */}
      <button
        style={styles.completeBtn}
        onClick={completeTask}
        disabled={completing}
      >
        {completing ? "Completing..." : "🎉 Mark Task as Complete"}
      </button>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#F7F8FC", padding: "20px", maxWidth: "480px", margin: "0 auto" },
  centered: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  navBack: { background: "none", border: "none", fontSize: "14px", color: "#6C47FF", cursor: "pointer", fontWeight: "600" },
  title: { fontSize: "20px", fontWeight: "700", color: "#1A202C" },
  taskCard: { background: "#fff", borderRadius: "20px", padding: "24px", textAlign: "center",
    marginBottom: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
  taskIcon: { fontSize: "56px", marginBottom: "12px" },
  taskTitle: { fontSize: "22px", fontWeight: "700", color: "#1A202C", marginBottom: "8px" },
  taskDesc: { fontSize: "14px", color: "#718096", fontStyle: "italic", marginBottom: "14px" },
  statusBadge: { display: "inline-block", background: "#C6F6D5", color: "#276749",
    borderRadius: "8px", padding: "6px 14px", fontSize: "13px", fontWeight: "600" },
  contactCard: { background: "#fff", borderRadius: "16px", padding: "16px",
    marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  contactTitle: { fontSize: "14px", fontWeight: "700", color: "#4A5568", marginBottom: "12px" },
  contactRow: { display: "flex", alignItems: "center", gap: "12px" },
  contactName: { fontSize: "16px", fontWeight: "600", color: "#1A202C" },
  callBtn: { display: "inline-block", marginTop: "6px", fontSize: "14px", color: "#6C47FF",
    fontWeight: "600", background: "#EDE9FF", padding: "6px 12px", borderRadius: "8px" },
  stepsCard: { background: "#fff", borderRadius: "16px", padding: "16px",
    marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  stepsTitle: { fontSize: "14px", fontWeight: "700", color: "#4A5568", marginBottom: "14px" },
  step: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px",
    fontSize: "14px", color: "#4A5568" },
  stepNum: { width: "24px", height: "24px", background: "#EDE9FF", color: "#6C47FF",
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", fontWeight: "700", flexShrink: 0 },
  completeBtn: { width: "100%", padding: "16px", background: "#38A169", color: "#fff",
    border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "700",
    cursor: "pointer", boxShadow: "0 4px 16px rgba(56,161,105,0.35)" },
  successCard: { background: "#fff", borderRadius: "24px", padding: "40px 28px",
    textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", maxWidth: "360px", width: "100%" },
  successTitle: { fontSize: "24px", fontWeight: "700", color: "#1A202C", margin: "16px 0 8px" },
  successMsg: { fontSize: "15px", color: "#718096", lineHeight: "1.6", marginBottom: "24px" },
  backBtn: { width: "100%", padding: "14px", background: "#6C47FF", color: "#fff",
    border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
};

export default ActiveTask;
