const STATUS_CONFIG = {
  open:      { bg: "#EBF8FF", color: "#2B6CB0", label: "⏳ Waiting",   },
  accepted:  { bg: "#C6F6D5", color: "#276749", label: "✅ On the way" },
  completed: { bg: "#E9D8FD", color: "#553C9A", label: "🎉 Done"       },
  expired:   { bg: "#FED7D7", color: "#9B2335", label: "❌ Expired"    },
  active:    { bg: "#FED7D7", color: "#9B2335", label: "🚨 Active SOS" },
  resolved:  { bg: "#C6F6D5", color: "#276749", label: "✅ Resolved"   },
};

const RequestStatusBadge = ({ status, size = "md" }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const fontSize = size === "sm" ? "11px" : size === "lg" ? "15px" : "13px";
  const padding  = size === "sm" ? "3px 8px" : size === "lg" ? "8px 16px" : "5px 12px";

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: "8px", padding, fontSize,
      fontWeight: "600", display: "inline-block",
    }}>
      {cfg.label}
    </span>
  );
};

export default RequestStatusBadge;
