import StatusBadge from "../common/StatusBadge";
import Icon from "../common/Icon";
import { formatDate } from "../../utils/format";

export default function RecommendationCard({ recommendation, showProject = false }) {
  if (!recommendation) return null;

  const {
    projectName,
    ruleCode,
    type = "ISSUE",
    issueDetected,
    severity = "MEDIUM",
    reason,
    recommendedAction,
    triggeredRule,
    generatedOn,
  } = recommendation;

  const isPositive = type === "POSITIVE";
  const severityClass = isPositive ? "severity-low" : `severity-${String(severity).toLowerCase()}`;

  return (
    <article className={`alert-card ${severityClass}`}>
      <div className="alert-icon-box">
        <Icon name={isPositive ? "check" : "activity"} size={18} />
      </div>

      <div className="alert-content">
        <div className="alert-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="alert-title">
              {issueDetected || "Decision Support Recommendation"}
            </span>
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
                backgroundColor: isPositive ? "#dcfce7" : "#fee2e2",
                color: isPositive ? "#15803d" : "#991b1b",
              }}
            >
              {type}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {ruleCode && (
              <span style={{ fontSize: "var(--text-xs)", fontFamily: "monospace", color: "var(--text-muted)" }}>
                Rule: {ruleCode}
              </span>
            )}
            {generatedOn && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {formatDate(generatedOn)}
              </span>
            )}
          </div>
        </div>

        {reason && <p className="alert-reason">{reason}</p>}

        {recommendedAction && (
          <div className="alert-action">
            <strong>Recommended Action:</strong> {recommendedAction}
          </div>
        )}

        {triggeredRule && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
            Triggered by decision rule: {triggeredRule}
          </div>
        )}
      </div>
    </article>
  );
}
