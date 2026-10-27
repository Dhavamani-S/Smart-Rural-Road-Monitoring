import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../services/dashboardService";
import { getErrorMessage } from "../services/api";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import ProgressBar from "../components/common/ProgressBar";
import SkeletonDashboard from "../components/common/Skeleton";
import Icon from "../components/common/Icon";
import RiskAlert from "../components/alerts/RiskAlert";
import RecommendationCard from "../components/alerts/RecommendationCard";
import {
  BudgetUtilizationBarChart,
  ExpenseCategoryDoughnutChart,
  HealthIndexBarChart,
  PlannedVsActualBarChart,
  ProgressTimelineLineChart,
  StatusDoughnutChart,
} from "../components/charts/ChartComponents";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "../utils/format";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardService.getDashboard();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
          <Icon name="alert" size={20} />
          <div>
            <strong>Unable to load portfolio dashboard</strong>
            <p style={{ margin: "4px 0 0" }}>{error}</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={loadData}>
          <Icon name="refresh" size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const statusDist = data?.statusDistribution || {};
  const projects = data?.projects || [];
  const expenseDist = data?.expenseDistribution || {};
  const progressTimeline = data?.progressTimeline || [];
  const recentUpdates = data?.recentUpdates || [];
  const pendingMilestones = data?.pendingMilestones || [];
  const alerts = data?.alerts || [];
  const recommendations = data?.recommendations || [];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Portfolio Dashboard</h1>
          <p className="page-subtitle">
            PMGSY rural road construction oversight, expenditure tracking, and automated risk analysis
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={loadData}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
          <Link to="/projects/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* 8 Stat Cards */}
      <div className="stat-card-grid">
        <StatCard
          title="Total Projects"
          value={formatNumber(summary.totalProjects)}
          subtitle="Portfolio active & completed"
          icon="projects"
          tone="blue"
        />
        <StatCard
          title="Completed"
          value={formatNumber(summary.completed)}
          subtitle={`${summary.totalProjects ? Math.round((summary.completed / summary.totalProjects) * 100) : 0}% delivery rate`}
          icon="check"
          tone="green"
        />
        <StatCard
          title="Delayed Projects"
          value={formatNumber(summary.delayed)}
          subtitle="Behind planned timeline"
          icon="alert"
          tone="red"
        />
        <StatCard
          title="Need Attention"
          value={formatNumber(summary.projectsRequiringAttention ?? summary.highRiskProjects)}
          subtitle="Flagged by decision rules"
          icon="activity"
          tone="amber"
        />
        <StatCard
          title="Total Budget"
          value={formatCurrency(summary.totalBudget, true)}
          subtitle="Sanctioned project capital"
          icon="rupee"
          tone="blue"
        />
        <StatCard
          title="Total Expenditure"
          value={formatCurrency(summary.totalExpenditure, true)}
          subtitle="Disbursed & recorded"
          icon="expenses"
          tone="green"
        />
        <StatCard
          title="Remaining Budget"
          value={formatCurrency(summary.remainingBudget, true)}
          subtitle="Available unspent capital"
          icon="rupee"
          tone="gray"
        />
        <StatCard
          title="Budget Utilised"
          value={formatPercent(summary.budgetUtilizationPercent, 1)}
          subtitle="Spending vs allocation"
          icon="activity"
          tone={summary.budgetUtilizationPercent > 100 ? "red" : summary.budgetUtilizationPercent >= 85 ? "amber" : "blue"}
        />
      </div>

      {/* Decision-Support Feature 1 & 2 & 3: Visual Analytics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Core Feature 1: Road Health Index Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="activity" size={18} /> Road Health Index Scores
              </div>
              <div className="card-subtitle">Healthy (≥80 green), Needs Attention (60-79 amber), Critical (&lt;60 red)</div>
            </div>
          </div>
          <HealthIndexBarChart projects={projects} />
        </div>

        {/* Core Feature 2: Delay Detection - Planned vs Actual Progress */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="projects" size={18} /> Planned vs Actual Progress (Delay Detection)
              </div>
              <div className="card-subtitle">Slippage comparison of actual delivery against baseline schedule</div>
            </div>
          </div>
          <PlannedVsActualBarChart projects={projects} />
        </div>

        {/* Core Feature 3: Budget Risk Analysis - Budget Utilisation */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="rupee" size={18} /> Budget Risk Analysis
              </div>
              <div className="card-subtitle">Safe (&lt;85%), Near Limit (85-100%), Over Budget (&gt;100%)</div>
            </div>
          </div>
          <BudgetUtilizationBarChart projects={projects} />
        </div>

        {/* Chart 4: Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="check" size={18} /> Project Status Breakdown
              </div>
              <div className="card-subtitle">Distribution across delivery stages</div>
            </div>
          </div>
          <StatusDoughnutChart statusDistribution={statusDist} />
        </div>

        {/* Chart 5: Progress Over Time Lines */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="dashboard" size={18} /> Progress Velocity Over Time
              </div>
              <div className="card-subtitle">Recorded progress timeline trends across projects</div>
            </div>
          </div>
          <ProgressTimelineLineChart progressTimeline={progressTimeline} />
        </div>

        {/* Chart 6: Expense By Category Doughnut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="expenses" size={18} /> Expense Distribution By Category
              </div>
              <div className="card-subtitle">Materials, Labour, Equipment, Haulage, Approvals</div>
            </div>
          </div>
          <ExpenseCategoryDoughnutChart expenseDistribution={expenseDist} />
        </div>
      </div>

      {/* Project Health & Performance Table (Core Feature 1 + Delayed flagging) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Icon name="projects" size={20} /> Project Health & Performance Table
            </div>
            <div className="card-subtitle">Comprehensive health rating, schedule slippage, and financial utilization</div>
          </div>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            View All Projects <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No project records available in portfolio.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th style={{ minWidth: 170 }}>Progress (Actual vs Planned)</th>
                  <th>Health Index</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Assigned Engineer</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => {
                  const isDelayed = p.status === "DELAYED";
                  return (
                    <tr
                      key={p.projectId}
                      style={{
                        backgroundColor: isDelayed ? "rgba(214, 69, 69, 0.04)" : undefined,
                      }}
                    >
                      <td>
                        <Link
                          to={`/projects/${p.projectId}`}
                          style={{
                            fontWeight: 600,
                            color: isDelayed ? "var(--status-red)" : "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {isDelayed && <Icon name="alert" size={14} color="var(--status-red)" />}
                          {p.name}
                        </Link>
                      </td>
                      <td>{p.location || "—"}</td>
                      <td>
                        <StatusBadge status={p.status} type="project" />
                      </td>
                      <td>
                        <ProgressBar
                          value={p.completedPercentage}
                          planned={p.plannedProgress}
                          status={p.status}
                          showLabels={true}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: "var(--text-md)" }}>
                            {Math.round(p.healthIndex)}
                          </span>
                          <StatusBadge status={p.healthCategory} type="health" />
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{formatCurrency(p.totalBudget, true)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: (p.budgetUtilizationPercent || 0) > 100 ? "var(--status-red)" : "inherit",
                          }}
                        >
                          {formatCurrency(p.totalExpenditure, true)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                          {p.assignedEngineerName || "Unassigned"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Risks & Decision Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Risk Alerts (Delay detection + Budget risk alerts) */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="alert" size={18} /> Operational Risk Alerts
              </div>
              <div className="card-subtitle">Automated delay detection & budget variance warnings</div>
            </div>
            <span className="status-badge badge-amber">{alerts.length} Active</span>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No critical risks detected across active projects.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {alerts.slice(0, 6).map((a) => (
                <RiskAlert key={a.id} alert={a} showProject={true} />
              ))}
            </div>
          )}
        </div>

        {/* Priority Recommendations */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="activity" size={18} /> Decision Support Recommendations
              </div>
              <div className="card-subtitle">Rule-based actionable recommendations with triggered rules</div>
            </div>
            <span className="status-badge badge-blue">{recommendations.length} Rules</span>
          </div>

          {recommendations.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No outstanding recommendations at this time.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {recommendations.slice(0, 6).map((r) => (
                <RecommendationCard key={r.id} recommendation={r} showProject={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Field Updates & Upcoming Milestones */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Recent Updates */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="activity" size={18} /> Recent Field Updates
              </div>
              <div className="card-subtitle">Latest progress submissions from site engineers</div>
            </div>
          </div>

          {recentUpdates.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No recent field updates logged.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentUpdates.slice(0, 5).map((u, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>
                      {u.projectName}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>
                      {u.remarks || "Progress updated"}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>
                      By {u.updatedByName} · {formatDate(u.updateDate)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 70 }}>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {u.completedPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming / Overdue Milestones */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="milestone" size={18} /> Upcoming & Overdue Milestones
              </div>
              <div className="card-subtitle">Critical stage gates awaiting completion</div>
            </div>
          </div>

          {pendingMilestones.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No pending stage milestones.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingMilestones.slice(0, 5).map((m) => (
                <div
                  key={m.milestoneId}
                  style={{
                    padding: "14px 16px",
                    background: m.overdue ? "var(--status-red-bg)" : "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid",
                    borderColor: m.overdue ? "var(--status-red-border)" : "var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                      Project: <strong>{m.projectName}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: m.overdue ? "var(--status-red)" : "var(--text-primary)" }}>
                      {formatDate(m.targetDate)}
                    </div>
                    {m.overdue && (
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--status-red)" }}>
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
