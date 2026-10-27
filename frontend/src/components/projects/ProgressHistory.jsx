import { Line } from "react-chartjs-2";
import Icon from "../common/Icon";
import ProgressBar from "../common/ProgressBar";
import { formatDate, formatDateTime } from "../../utils/format";

export default function ProgressHistory({
  history = [],
  currentPercentage = 0,
  isEngineer = false,
  isCompleted = false,
  onOpenAddModal,
}) {
  // Sort history ascending for timeline chart
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.updateDate || a.createdAt) - new Date(b.updateDate || b.createdAt)
  );

  const chartData = {
    labels: sortedHistory.map((item) => formatDate(item.updateDate || item.createdAt)),
    datasets: [
      {
        label: "Verified Progress (%)",
        data: sortedHistory.map((item) => item.completedPercentage),
        borderColor: "#2fa36b",
        backgroundColor: "rgba(47, 163, 107, 0.12)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#2fa36b",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Progress: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => `${v}%`,
          font: { size: 13 },
        },
        grid: { color: "#f1f5f9" },
      },
      x: {
        ticks: { font: { size: 13 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Velocity / Progress Line Chart */}
      {sortedHistory.length > 1 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="dashboard" size={18} /> Progress Curve Over Time
              </div>
              <div className="card-subtitle">Cumulative completion velocity recorded from site inspections</div>
            </div>
          </div>
          <div style={{ height: "260px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Icon name="activity" size={18} /> Progress Verification Logs
            </div>
            <div className="card-subtitle">
              Current verified completion: <strong>{currentPercentage}%</strong>
            </div>
          </div>
          {isEngineer && !isCompleted && onOpenAddModal && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAddModal}
            >
              <Icon name="plus" size={14} /> Add Progress Update
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
            No progress verification updates have been recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inspection Date</th>
                  <th>Completion %</th>
                  <th>Remarks / Chainage Work</th>
                  <th>Recorded By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{formatDate(item.updateDate || item.createdAt)}</strong>
                    </td>
                    <td>
                      <div style={{ width: 140 }}>
                        <ProgressBar
                          value={item.completedPercentage}
                          showLabels={true}
                        />
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: 300 }}>
                      {item.remarks || "—"}
                    </td>
                    <td>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        {item.updatedByName || "Site Engineer"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        {formatDateTime(item.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
