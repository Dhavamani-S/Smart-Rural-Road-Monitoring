import HealthGauge from "./HealthGauge";
import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/format";

export default function HealthIndexCard({ health }) {
  if (!health) {
    return (
      <div className="card">
        <div className="card-title">Road Health Index</div>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>
          Health index evaluation is currently unavailable for this project.
        </p>
      </div>
    );
  }

  const {
    healthIndex = 0,
    category = "HEALTHY",
    progressScore = 0,
    budgetScore = 0,
    scheduleScore = 0,
    weightProgress = 0.4,
    weightBudget = 0.3,
    weightSchedule = 0.3,
    factors = [],
    notes = [],
    calculatedOn,
  } = health;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            Road Health Index
            <StatusBadge status={category} type="health" />
          </div>
          <div className="card-subtitle">
            Rule-based weighted index (Progress 40%, Budget 30%, Schedule 30%)
          </div>
        </div>
        {calculatedOn && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            Evaluated: {formatDate(calculatedOn)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "28px" }}>
        <div style={{ flex: "0 0 170px", display: "flex", justifyContent: "center" }}>
          <HealthGauge score={healthIndex} category={category} />
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="health-breakdown-grid">
            <div className="health-breakdown-item">
              <span>Progress Score ({(weightProgress * 100).toFixed(0)}%)</span>
              <strong style={{ color: "var(--accent-primary)" }}>
                {Math.round(progressScore)} / 100
              </strong>
            </div>
            <div className="health-breakdown-item">
              <span>Budget Score ({(weightBudget * 100).toFixed(0)}%)</span>
              <strong style={{ color: "var(--accent-secondary)" }}>
                {Math.round(budgetScore)} / 100
              </strong>
            </div>
            <div className="health-breakdown-item">
              <span>Schedule Score ({(weightSchedule * 100).toFixed(0)}%)</span>
              <strong style={{ color: "#8b5cf6" }}>
                {Math.round(scheduleScore)} / 100
              </strong>
            </div>
          </div>

          {/* Factors explaining what lowered or affected the score */}
          {factors && factors.length > 0 && (
            <div style={{ marginTop: "18px" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Factors Affecting Health Index:
              </div>
              <ul style={{ paddingLeft: "20px", fontSize: "var(--text-sm)", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                {factors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {notes && notes.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                Engine Observations:
              </div>
              <ul style={{ paddingLeft: "20px", fontSize: "var(--text-xs)", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "3px" }}>
                {notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
