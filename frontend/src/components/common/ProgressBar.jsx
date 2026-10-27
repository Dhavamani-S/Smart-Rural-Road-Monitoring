import { formatPercent } from "../../utils/format";

export default function ProgressBar({
  value = 0,
  planned = null,
  showLabels = true,
  label = "Progress",
  status = "",
}) {
  const actualPercent = Math.min(100, Math.max(0, Number(value) || 0));
  const plannedPercent =
    planned !== null && planned !== undefined
      ? Math.min(100, Math.max(0, Number(planned) || 0))
      : null;

  const isDelayed = status === "DELAYED";

  return (
    <div className="progress-container">
      {showLabels && (
        <div className="progress-header">
          <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "var(--text-xs)" }}>
            {label}
          </span>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "var(--text-xs)" }}>
              {formatPercent(actualPercent, 0)}
            </span>
            {plannedPercent !== null && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                (Planned: {formatPercent(plannedPercent, 0)})
              </span>
            )}
          </div>
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={actualPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-fill ${isDelayed ? "status-red" : "status-green"}`}
          style={{
            width: `${actualPercent}%`,
            backgroundColor: isDelayed ? "var(--status-red)" : "var(--accent-primary)",
          }}
        />
        {plannedPercent !== null && (
          <div
            className="progress-planned-marker"
            style={{ left: `${plannedPercent}%` }}
            title={`Sanctioned Plan: ${formatPercent(plannedPercent, 1)}`}
          />
        )}
      </div>
    </div>
  );
}
