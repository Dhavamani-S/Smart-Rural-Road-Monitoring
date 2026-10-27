import {
  HEALTH_CATEGORY_META,
  PROJECT_STATUS_META,
  SEVERITY_META,
} from "../../utils/constants";

export default function StatusBadge({ status, type = "project", className = "" }) {
  if (!status) return null;

  let label = String(status).replaceAll("_", " ");
  let badgeClass = "badge-gray";

  if (type === "project") {
    const meta = PROJECT_STATUS_META[status];
    if (meta) {
      label = meta.label;
      badgeClass = meta.badgeClass;
    }
  } else if (type === "health") {
    const meta = HEALTH_CATEGORY_META[status];
    if (meta) {
      label = meta.label;
      badgeClass = meta.badgeClass;
    }
  } else if (type === "severity") {
    const meta = SEVERITY_META[status];
    if (meta) {
      label = meta.label;
      badgeClass = meta.badgeClass;
    }
  } else if (type === "user") {
    label = status ? "Active" : "Inactive";
    badgeClass = status ? "badge-green" : "badge-gray";
  }

  return (
    <span className={`status-badge ${badgeClass} ${className}`}>
      <span className="status-badge-dot" />
      {label}
    </span>
  );
}
