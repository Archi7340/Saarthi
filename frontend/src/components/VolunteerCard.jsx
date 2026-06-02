/**
 * Displays a volunteer's summary card
 * Used in family dashboard to show who accepted a task
 */
const VolunteerCard = ({ volunteer, onCall }) => {
  if (!volunteer) return null;

  return (
    <div style={styles.card}>
      <div style={styles.avatar}>
        {volunteer.name?.charAt(0).toUpperCase()}
      </div>
      <div style={styles.info}>
        <p style={styles.name}>{volunteer.name}</p>
        <p style={styles.meta}>
          ✅ {volunteer.tasksCompleted || 0} tasks completed
        </p>
      </div>
      {volunteer.phone && (
        <a href={`tel:${volunteer.phone}`} style={styles.callBtn}>
          📞 Call
        </a>
      )}
    </div>
  );
};

const styles = {
  card: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#F0FFF4", border: "1.5px solid #9AE6B4",
    borderRadius: "12px", padding: "12px 14px",
  },
  avatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "#38A169", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", fontWeight: "700", flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontSize: "14px", fontWeight: "600", color: "#1A202C" },
  meta: { fontSize: "12px", color: "#718096", marginTop: "2px" },
  callBtn: {
    padding: "6px 12px", background: "#38A169", color: "#fff",
    borderRadius: "8px", fontSize: "12px", fontWeight: "600",
    textDecoration: "none",
  },
};

export default VolunteerCard;
