import { useState, useCallback } from "react";
import useSocketEvent from "../hooks/useSocket";
import api from "../api/axios.config";

/**
 * Floating medicine reminder card that appears when a socket reminder fires.
 * Renders on top of any elderly page.
 * Usage: <MedicineAckOverlay elderlyId={user._id} />
 */
const MedicineAckOverlay = () => {
  const [reminders, setReminders] = useState([]);
  const [acking, setAcking] = useState("");

  // Listen for med:reminder socket event
  const handleReminder = useCallback((data) => {
    setReminders((prev) => {
      const exists = prev.find(
        (r) => r.scheduleId === data.scheduleId && r.scheduledTime === data.scheduledTime
      );
      if (exists) return prev;
      return [...prev, data];
    });
  }, []);

  useSocketEvent("med:reminder", handleReminder);

  const acknowledge = async (reminder) => {
    setAcking(reminder.scheduleId);
    try {
      await api.patch(`/medicine/${reminder.scheduleId}/acknowledge`, {
        scheduledTime: reminder.scheduledTime,
        scheduledDate: reminder.scheduledDate,
      });
      setReminders((prev) => prev.filter((r) => r.scheduleId !== reminder.scheduleId));
    } catch (err) {
      console.error("Ack failed:", err);
    } finally {
      setAcking("");
    }
  };

  const dismiss = (scheduleId) => {
    setReminders((prev) => prev.filter((r) => r.scheduleId !== scheduleId));
  };

  if (reminders.length === 0) return null;

  return (
    <div style={styles.overlay}>
      {reminders.map((reminder) => (
        <div key={reminder.scheduleId} style={styles.card}>
          <div style={styles.pill}>💊</div>
          <div style={styles.body}>
            <p style={styles.title}>Medicine Time!</p>
            <p style={styles.medName}>{reminder.medicineName}</p>
            <p style={styles.dosage}>{reminder.dosage}</p>
            <p style={styles.time}>Scheduled at {reminder.scheduledTime}</p>
          </div>
          <div style={styles.actions}>
            <button
              style={styles.takenBtn}
              onClick={() => acknowledge(reminder)}
              disabled={acking === reminder.scheduleId}
            >
              {acking === reminder.scheduleId ? "..." : "✓ Taken"}
            </button>
            <button style={styles.dismissBtn} onClick={() => dismiss(reminder.scheduleId)}>
              Later
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
    width: "calc(100% - 40px)", maxWidth: "440px", zIndex: 1000,
    display: "flex", flexDirection: "column", gap: "10px",
  },
  card: {
    background: "#fff", borderRadius: "18px", padding: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    border: "2px solid #EDE9FF",
    display: "flex", alignItems: "center", gap: "14px",
    animation: "slideUp 0.3s ease",
  },
  pill: { fontSize: "36px", flexShrink: 0 },
  body: { flex: 1 },
  title: { fontSize: "12px", fontWeight: "600", color: "#6C47FF", textTransform: "uppercase",
    letterSpacing: "0.05em", marginBottom: "2px" },
  medName: { fontSize: "17px", fontWeight: "700", color: "#1A202C" },
  dosage: { fontSize: "13px", color: "#718096" },
  time: { fontSize: "12px", color: "#A0AEC0", marginTop: "2px" },
  actions: { display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 },
  takenBtn: {
    padding: "10px 16px", background: "#38A169", color: "#fff",
    border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  dismissBtn: {
    padding: "6px 16px", background: "#F7F8FC", color: "#718096",
    border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "12px",
    cursor: "pointer",
  },
};

export default MedicineAckOverlay;
