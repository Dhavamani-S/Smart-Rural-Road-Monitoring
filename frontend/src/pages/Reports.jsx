import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import projectService from "../services/projectService";
import dashboardService from "../services/dashboardService";
import { getErrorMessage } from "../services/api";
import SkeletonDashboard from "../components/common/Skeleton";
import Icon from "../components/common/Icon";
import StatusBadge from "../components/common/StatusBadge";
import ProgressBar from "../components/common/ProgressBar";
import { formatCurrency, formatDate, formatPercent } from "../utils/format";

export default function Reports() {
  const { id } = useParams();

  const [portfolioData, setPortfolioData] = useState(null);
  const [projectReport, setProjectReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    if (id) {
      // Detailed Project Report
      projectService
        .getProjectReport(id)
        .then((res) => setProjectReport(res))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    } else {
      // Portfolio Summary Report
      dashboardService
        .getDashboard()
        .then((res) => setPortfolioData(res))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
          <Icon name="alert" size={20} />
          <div>
            <strong>Unable to generate inspection report</strong>
            <p style={{ margin: "4px 0 0" }}>{error}</p>
          </div>
        </div>
        <Link to="/reports" className="btn btn-secondary">
          Back to Reports
        </Link>
      </div>
    );
  }

  // Render Detailed Project Report (/reports/:id)
  if (id && projectReport) {
    const {
      project,
      timeline,
      health,
      budget,
      milestones = [],
      progressHistory = [],
      expenses = [],
      alerts = [],
      recommendations = [],
      generatedOn,
    } = projectReport;

    return (
      <div>
        {/* Actions bar (hidden in print) */}
        <div className="page-header">
          <div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: 6 }}>
              <Link to="/reports" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                ← Portfolio Summary Report
              </Link>
            </div>
            <h1 className="page-title">Project Inspection & Audit Report</h1>
            <p className="page-subtitle">
              Comprehensive government performance dossier for {project.name}
            </p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Icon name="printer" size={16} /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="printable-report">
          {/* Official Document Letterhead */}
          <div className="card" style={{ borderBottom: "3px solid #1f2937", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  SMARTROAD RURAL INFRASTRUCTURE MONITORING SYSTEM
                </p>
                <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", margin: "6px 0" }}>
                  {project.name}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
                  Location: <strong>{project.location}</strong> · Supervisor: <strong>{project.assignedEngineerName || "Unassigned"}</strong>
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <StatusBadge status={project.status} type="project" />
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 6 }}>
                  Generated On: <strong>{formatDate(generatedOn || new Date())}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-title" style={{ marginBottom: 14 }}>1. Executive Summary & KPIs</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={{ padding: 14, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>TOTAL BUDGET</span>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginTop: 4 }}>{formatCurrency(project.totalBudget)}</div>
              </div>
              <div style={{ padding: 14, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>TOTAL DISBURSED</span>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginTop: 4 }}>{formatCurrency(project.totalExpenditure)} ({formatPercent(project.budgetUtilizationPercent, 0)})</div>
              </div>
              <div style={{ padding: 14, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>COMPLETION PROGRESS</span>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--accent-primary)", marginTop: 4 }}>{project.completedPercentage}%</div>
              </div>
              <div style={{ padding: 14, background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>ROAD HEALTH INDEX</span>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  {Math.round(health?.healthIndex || 0)}
                  <StatusBadge status={health?.category} type="health" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Timeline & Schedule */}
          {timeline && (
            <div className="card" style={{ marginBottom: "24px" }}>
              <div className="card-title" style={{ marginBottom: 14 }}>2. Schedule & Velocity Assessment</div>
              <div style={{ marginBottom: 16 }}>
                <ProgressBar
                  value={project.completedPercentage}
                  planned={timeline.plannedProgress}
                  status={project.status}
                  showLabels={true}
                  label="Construction Completion vs Planned Schedule Target"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, fontSize: "var(--text-sm)", background: "var(--bg-subtle)", padding: 14, borderRadius: "var(--radius-sm)" }}>
                <div>Start Date: <strong>{formatDate(timeline.startDate)}</strong></div>
                <div>Deadline: <strong>{formatDate(timeline.deadline)}</strong></div>
                <div>Total Duration: <strong>{timeline.totalDays} Days</strong></div>
                <div>Schedule Gap: <strong>{timeline.progressGap > 0 ? `-${timeline.progressGap.toFixed(1)}% (Behind)` : "On Schedule"}</strong></div>
              </div>
            </div>
          )}

          {/* Section 3: Budget Analysis & EVM */}
          {budget && budget.analysis && (
            <div className="card" style={{ marginBottom: "24px" }}>
              <div className="card-title" style={{ marginBottom: 14 }}>3. Budget Analysis & Financial Performance</div>
              <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
                Interpretation: {budget.analysis.interpretation}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, fontSize: "var(--text-sm)", background: "var(--bg-subtle)", padding: 14, borderRadius: "var(--radius-sm)" }}>
                <div>Earned Value: <strong>{formatCurrency(budget.analysis.earnedValue)}</strong></div>
                <div>Cost Efficiency Index: <strong>{budget.analysis.costEfficiencyIndex !== null ? budget.analysis.costEfficiencyIndex.toFixed(2) : "N/A"}</strong></div>
                <div>Spending Status: <strong>{budget.analysis.status?.replaceAll("_", " ")}</strong></div>
              </div>
            </div>
          )}

          {/* Section 4: Milestones Table */}
          <div className="card avoid-break" style={{ marginBottom: "24px" }}>
            <div className="card-title" style={{ marginBottom: 14 }}>4. Stage Gate Milestones ({milestones.length})</div>
            {milestones.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No milestones defined.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Milestone Title</th>
                      <th>Target Date</th>
                      <th>Status</th>
                      <th>Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.title}</strong></td>
                        <td>{formatDate(m.targetDate)}</td>
                        <td>
                          <StatusBadge
                            status={m.completed ? "COMPLETED" : m.targetDate < new Date().toISOString().split("T")[0] ? "DELAYED" : "IN_PROGRESS"}
                            type="project"
                          />
                        </td>
                        <td>{m.completedDate ? formatDate(m.completedDate) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Progress History */}
          <div className="card avoid-break" style={{ marginBottom: "24px" }}>
            <div className="card-title" style={{ marginBottom: 14 }}>5. Construction Progress Log ({progressHistory.length})</div>
            {progressHistory.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No progress entries recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Completion %</th>
                      <th>Remarks</th>
                      <th>Reported By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressHistory.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDate(p.updateDate || p.createdAt)}</td>
                        <td><strong>{p.completedPercentage}%</strong></td>
                        <td>{p.remarks || "—"}</td>
                        <td>{p.updatedByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 6: Expenses Ledger */}
          <div className="card avoid-break" style={{ marginBottom: "24px" }}>
            <div className="card-title" style={{ marginBottom: 14 }}>6. Itemized Expense Disbursements ({expenses.length})</div>
            {expenses.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No expense records filed.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDate(e.expenseDate)}</td>
                        <td>{e.category}</td>
                        <td>{e.description || "—"}</td>
                        <td style={{ textAlign: "right" }}><strong>{formatCurrency(e.amount)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 7: Risk Alerts & Recommendations */}
          <div className="card avoid-break">
            <div className="card-title" style={{ marginBottom: 14 }}>7. Automated Alerts & Recommendations</div>
            {alerts.length === 0 && recommendations.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No active risks or warnings.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {alerts.map((a) => (
                  <div key={a.id} style={{ padding: 12, borderLeft: "4px solid var(--status-red)", background: "var(--bg-subtle)", fontSize: "var(--text-sm)" }}>
                    <strong>[{a.category}] {a.title}:</strong> {a.reason} — <em>Action: {a.suggestedAction}</em>
                  </div>
                ))}
                {recommendations.map((r) => (
                  <div key={r.id} style={{ padding: 12, borderLeft: "4px solid var(--status-blue)", background: "var(--bg-subtle)", fontSize: "var(--text-sm)" }}>
                    <strong>Recommendation ({r.ruleCode}):</strong> {r.issueDetected} — <em>Action: {r.recommendedAction}</em>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Portfolio Summary Report (/reports)
  const summary = portfolioData?.summary || {};
  const projects = portfolioData?.projects || [];

  return (
    <div>
      {/* Header with Print action */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Portfolio Summary Report</h1>
          <p className="page-subtitle">
            Consolidated rural road construction monitoring and audit summary
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Icon name="printer" size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Report View */}
      <div className="printable-report">
        {/* Letterhead */}
        <div className="card" style={{ borderBottom: "3px solid #1f2937", marginBottom: "24px" }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            OFFICIAL GOVERNMENT AUDIT DOSSIER · SMARTROAD
          </p>
          <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", margin: "6px 0" }}>
            Rural Road Infrastructure Portfolio Overview
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Report Date: <strong>{formatDate(portfolioData?.generatedOn || new Date())}</strong>
          </p>
        </div>

        {/* Portfolio Stats Grid */}
        <div className="stat-card-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <span className="stat-card-label">Total Projects</span>
            <div className="stat-card-value">{summary.totalProjects || 0}</div>
            <div className="stat-card-subtext">All monitored contracts</div>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Total Budget</span>
            <div className="stat-card-value">{formatCurrency(summary.totalBudget, true)}</div>
            <div className="stat-card-subtext">Allocated funds</div>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Total Expenditure</span>
            <div className="stat-card-value">{formatCurrency(summary.totalExpenditure, true)}</div>
            <div className="stat-card-subtext">Recorded spending ({formatPercent(summary.budgetUtilizationPercent, 0)})</div>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Requiring Attention</span>
            <div className="stat-card-value" style={{ color: "var(--status-red)" }}>
              {summary.projectsRequiringAttention ?? summary.highRiskProjects ?? 0}
            </div>
            <div className="stat-card-subtext">Delayed or critical health</div>
          </div>
        </div>

        {/* Portfolio Projects Table */}
        <div className="card avoid-break">
          <div className="card-header">
            <div>
              <div className="card-title">Comprehensive Project Status Register</div>
              <div className="card-subtitle">Detailed delivery and financial indicators for each project</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Health Index</th>
                  <th>Budget</th>
                  <th>Expenditure</th>
                  <th>Deadline</th>
                  <th className="no-print">Report Link</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.projectId}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        {p.assignedEngineerName || "Unassigned"}
                      </div>
                    </td>
                    <td>{p.location || "—"}</td>
                    <td><StatusBadge status={p.status} type="project" /></td>
                    <td>
                      <ProgressBar value={p.completedPercentage} planned={p.plannedProgress} showLabels={true} />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong>{Math.round(p.healthIndex)}</strong>
                        <StatusBadge status={p.healthCategory} type="health" />
                      </div>
                    </td>
                    <td>{formatCurrency(p.totalBudget, true)}</td>
                    <td>{formatCurrency(p.totalExpenditure, true)}</td>
                    <td>{formatDate(p.deadline)}</td>
                    <td className="no-print">
                      <Link to={`/reports/${p.projectId}`} className="btn btn-secondary btn-sm">
                        View Dossier →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
