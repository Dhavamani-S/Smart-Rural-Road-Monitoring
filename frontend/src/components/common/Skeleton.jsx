export function SkeletonText({ width = "100%", height = "16px", style = {} }) {
  return (
    <div
      className="skeleton skeleton-text"
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonCard({ height = "140px", style = {} }) {
  return (
    <div className="skeleton-card" style={{ minHeight: height, ...style }}>
      <div className="skeleton skeleton-text" style={{ width: "40%", height: "14px", marginBottom: "12px" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%", height: "28px", marginBottom: "12px" }} />
      <div className="skeleton skeleton-text" style={{ width: "80%", height: "14px" }} />
    </div>
  );
}

export function SkeletonChart({ height = "280px", title = "Loading chart..." }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="skeleton skeleton-text" style={{ width: "160px", height: "18px" }} />
      </div>
      <div
        className="skeleton"
        style={{
          height,
          width: "100%",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)",
        }}
      >
        {title}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
        <div className="skeleton skeleton-text" style={{ width: "200px", height: "20px" }} />
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton skeleton-text" style={{ width: "70px", height: "13px" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: c === 0 ? "140px" : "80px", height: "15px" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SkeletonDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="stat-card-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        <SkeletonChart height="240px" />
        <SkeletonChart height="240px" />
      </div>
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}

