import StatusBadge from "../common/StatusBadge";
import Icon from "../common/Icon";
import { formatDate } from "../../utils/format";

export default function RiskAlert({ alert, showProject = false }) {
  if (!alert) return null;

  const {
    projectName,
    category,
    ruleCode,
    severity = "MEDIUM",
    title,
    reason,
    suggestedAction,
    confirmed = false,
    generatedOn,
  } = alert;

  const severityClass = `severity-${String(severity).toLowerCase()}`;

  return (
    <article className={`alert-card ${severityClass}`}>
      <div className="alert-icon-box">
        <Icon name="alert" size={18} />
      </div>

      <div className="alert-content">
        <div className="alert-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="alert-title">{title}</span>
            {category && (
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
                [{category}]
              </span>
            )}
            {showProject && projectName && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 500 }}>
                ({projectName})
              </span>
            )}
            <StatusBadge status={severity} type="severity" />
            <span
              style={{
                fontSize: "var(--text-xs)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 600,
                backgroundColor: confirmed ? "#fee2e2" : "#fef3c7",
                color: confirmed ? "#991b1b" : "#92400e",
              }}
            >
              {confirmed ? "CONFIRMED BREACH" : "EARLY WARNING"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {ruleCode && (
              <span style={{ fontSize: "var(--text-xs)", fontFamily: "monospace", color: "var(--text-muted)" }}>
                [{ruleCode}]
              </span>
            )}
            {generatedOn && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {formatDate(generatedOn)}
              </span>
            )}
          </div>
        </div>

        <p className="alert-reason">{reason}</p>

        {suggestedAction && (
          <div className="alert-action">
            <strong>Suggested Action:</strong> {suggestedAction}
          </div>
        )}
      </div>
    </article>
  );
}
