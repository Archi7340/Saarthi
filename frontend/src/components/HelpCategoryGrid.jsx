const CATEGORIES = [
  { key: "medicine",  emoji: "💊", label: "Medicine Help"  },
  { key: "grocery",   emoji: "🛒", label: "Grocery Help"   },
  { key: "doctor",    emoji: "🏥", label: "Doctor Visit"   },
  { key: "technical", emoji: "📱", label: "Tech Help"      },
  { key: "other",     emoji: "🙋", label: "Other Help"     },
];

/**
 * Grid of help category buttons for the elderly home screen
 * @param {Function} onSelect - called with category key when tapped
 * @param {string}   loading  - key of the currently loading category
 */
const HelpCategoryGrid = ({ onSelect, loading = "" }) => (
  <div style={styles.grid}>
    {CATEGORIES.map((cat) => (
      <button
        key={cat.key}
        style={styles.btn}
        onClick={() => onSelect(cat.key)}
        disabled={loading === cat.key}
        aria-label={cat.label}
      >
        <span style={styles.emoji}>{cat.emoji}</span>
        <span style={styles.label}>
          {loading === cat.key ? "Sending…" : cat.label}
        </span>
      </button>
    ))}
  </div>
);

const styles = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  btn: {
    padding: "20px 12px", background: "#fff",
    border: "2px solid #E2E8F0", borderRadius: "16px",
    cursor: "pointer", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s",
  },
  emoji: { fontSize: "32px" },
  label: { fontSize: "15px", fontWeight: "600", color: "#2D3748" },
};

export default HelpCategoryGrid;
