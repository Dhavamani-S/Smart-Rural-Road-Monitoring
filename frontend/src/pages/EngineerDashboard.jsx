import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import dashboardService from "../services/dashboardService";
import projectService from "../services/projectService";
import { getErrorMessage } from "../services/api";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import ProgressBar from "../components/common/ProgressBar";
import SkeletonDashboard from "../components/common/Skeleton";
import Toast from "../components/common/Toast";
import Icon from "../components/common/Icon";
import RiskAlert from "../components/alerts/RiskAlert";
import RecommendationCard from "../components/alerts/RecommendationCard";
import {
  UpdateProgressModal,
  AddExpenseModal,
  UploadPhotoModal,
} from "../components/projects/ActionForms";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "../utils/format";

export default function EngineerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  // Active modal targets
  const [activeModal, setActiveModal] = useState({
    type: null, // "progress" | "expense" | "photo"
    project: null,
  });

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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

  // Quick milestone completion from engineer dashboard
  const handleMarkMilestoneComplete = async (projectId, milestoneId, title) => {
    try {
      await projectService.completeMilestone(projectId, milestoneId);
      addToast(`Milestone "${title}" marked as complete!`, "success");
      loadData();
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    }
  };

  // Greeting computation
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Engineer";
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  const todayFormatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
          <Icon name="alert" size={20} />
          <div>
            <strong>Unable to load site engineer dashboard</strong>
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
  const projects = data?.projects || [];
  const pendingMilestones = data?.pendingMilestones || [];
  const alerts = data?.alerts || [];
  const recommendations = data?.recommendations || [];
  const recentUpdates = data?.recentUpdates || [];

  // Urgent "Needs your attention" detection
  const overdueMilestones = pendingMilestones.filter((m) => m.overdue);
  const delayedProjects = projects.filter((p) => p.status === "DELAYED");

  // Projects with no update for 14+ days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const staleProjects = projects.filter((p) => {
    if (p.status === "COMPLETED") return false;
    // Check if there is a recent update for this project
    const latestUpdate = recentUpdates.find((u) => u.projectId === p.projectId);
    if (latestUpdate?.updateDate) {
      return new Date(latestUpdate.updateDate) < fourteenDaysAgo;
    }
    if (p.updatedAt) {
      return new Date(p.updatedAt) < fourteenDaysAgo;
    }
    return false;
  });

  const hasUrgentAttention =
    overdueMilestones.length > 0 || delayedProjects.length > 0 || staleProjects.length > 0;

  return (
    <div>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Page Header with Greeting & Date */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{getGreeting()}</h1>
          <p className="page-subtitle">
            {todayFormatted} · Site Engineer Field Operations & Road Supervision
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={loadData}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* "Needs your attention" strip at the top when urgent items exist */}
      {hasUrgentAttention && (
        <div className="attention-strip" role="region" aria-label="Urgent project attention required">
          <div className="attention-strip-header">
            <Icon name="alert" size={20} color="var(--status-amber)" />
            <span>Needs Your Immediate Attention</span>
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "#78350f", margin: "0 0 8px" }}>
            The decision engine has flagged items requiring on-site supervision or milestone sign-off:
          </p>

          {/* Overdue milestones */}
          {overdueMilestones.map((m) => (
            <div key={`m-${m.milestoneId}`} className="attention-item">
              <div>
                <strong style={{ color: "var(--status-red)" }}>⚠️ Overdue Milestone: </strong>
                <span>{m.title}</span> on project <strong>{m.projectName}</strong> (Due {formatDate(m.targetDate)})
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleMarkMilestoneComplete(m.projectId, m.milestoneId, m.title)}
                >
                  <Icon name="check" size={14} /> Mark Complete
                </button>
                <Link
                  to={`/projects/${m.projectId}?tab=milestones`}
                  className="btn btn-secondary btn-sm"
                >
                  View Tab →
                </Link>
              </div>
            </div>
          ))}

          {/* Delayed projects */}
          {delayedProjects.map((p) => (
            <div key={`dp-${p.projectId}`} className="attention-item">
              <div>
                <strong style={{ color: "var(--status-red)" }}>⏱️ Construction Delayed: </strong>
                <strong>{p.name}</strong> is behind planned target ({p.completedPercentage}% actual vs {p.plannedProgress}% planned).
              </div>
              <Link
                to={`/projects/${p.projectId}?tab=overview`}
                className="btn btn-secondary btn-sm"
              >
                Inspect Schedule →
              </Link>
            </div>
          ))}

          {/* Stale projects (no updates in 14+ days) */}
          {staleProjects.map((p) => (
            <div key={`sp-${p.projectId}`} className="attention-item">
              <div>
                <strong style={{ color: "#b45309" }}>📋 No Field Updates (14+ Days): </strong>
                <strong>{p.name}</strong> has not received a chainage progress submission recently.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveModal({ type: "progress", project: p })}
              >
                <Icon name="activity" size={14} /> Update Progress
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="stat-card-grid">
        <StatCard
          title="Assigned Projects"
          value={formatNumber(projects.length)}
          subtitle="Rural roads under your supervision"
          icon="projects"
          tone="blue"
        />
        <StatCard
          title="In Progress"
          value={formatNumber(summary.inProgress)}
          subtitle="Active construction sites"
          icon="activity"
          tone="green"
        />
        <StatCard
          title="Delayed"
          value={formatNumber(summary.delayed)}
          subtitle="Behind sanctioned schedule"
          icon="alert"
          tone="red"
        />
        <StatCard
          title="Completed"
          value={formatNumber(summary.completed)}
          subtitle="Delivered & inspected"
          icon="check"
          tone="green"
        />
      </div>

      {/* Assigned Projects Detailed Touch-Friendly Cards */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)" }}>
              Assigned Road Projects ({projects.length})
            </h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
              Touch cards to inspect details, or use quick action buttons to log field data
            </p>
          </div>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            All Projects <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div className="empty-state-icon">
              <Icon name="projects" size={32} />
            </div>
            <h3 className="empty-state-title">No Projects Assigned Yet</h3>
            <p className="empty-state-text">
              Your administrator will assign rural road projects to your account.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
            {projects.map((p) => {
              const isCompleted = p.status === "COMPLETED";
              const isDelayed = p.status === "DELAYED";

              // Compute remaining or overdue days from deadline
              let deadlineText = "";
              if (p.deadline) {
                const diffTime = new Date(p.deadline) - new Date();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                  deadlineText = `Overdue by ${Math.abs(diffDays)} days`;
                } else {
                  deadlineText = `${diffDays} days remaining`;
                }
              }

              return (
                <div
                  key={p.projectId}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderColor: isDelayed ? "var(--status-red-border)" : undefined,
                    boxShadow: isDelayed ? "0 2px 8px rgba(214, 69, 69, 0.08)" : undefined,
                  }}
                >
                  <div>
                    {/* Top Row: Title + Status + Health Score Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/projects/${p.projectId}`}
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            display: "block",
                            lineHeight: 1.3,
                          }}
                        >
                          {p.name}
                        </Link>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <span>📍 {p.location || "Location unspecified"}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <StatusBadge status={p.status} type="project" />
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                            {Math.round(p.healthIndex)}
                          </span>
                          <StatusBadge status={p.healthCategory} type="health" />
                        </div>
                      </div>
                    </div>

                    {/* Progress with Planned Marker & Sentence */}
                    <div style={{ margin: "16px 0 14px" }}>
                      <ProgressBar
                        value={p.completedPercentage}
                        planned={p.plannedProgress}
                        status={p.status}
                        showLabels={true}
                        label="Construction Completion"
                      />
                    </div>

                    {/* Budget & Expenditure Metric Box */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        padding: "12px 16px",
                        background: "var(--bg-subtle)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                          Sanctioned Budget
                        </span>
                        <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginTop: 2 }}>
                          {formatCurrency(p.totalBudget, true)}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                          Spent ({formatPercent(p.budgetUtilizationPercent, 0)})
                        </span>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "var(--text-md)",
                            marginTop: 2,
                            color: (p.budgetUtilizationPercent || 0) > 100 ? "var(--status-red)" : "inherit",
                          }}
                        >
                          {formatCurrency(p.totalExpenditure, true)}
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Deadline info */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        marginBottom: 16,
                      }}
                    >
                      <span>Deadline: <strong>{formatDate(p.deadline)}</strong></span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: isDelayed ? "var(--status-red)" : "var(--text-secondary)",
                        }}
                      >
                        {deadlineText}
                      </span>
                    </div>
                  </div>

                  {/* Quick-action buttons (Touch-friendly minimum 44px) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isCompleted ? "1fr" : "repeat(auto-fit, minmax(110px, 1fr))",
                      gap: 8,
                      paddingTop: 14,
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveModal({ type: "progress", project: p })}
                          title="Record chainage completion"
                        >
                          <Icon name="activity" size={15} /> Update Progress
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveModal({ type: "expense", project: p })}
                          title="Record site voucher expense"
                        >
                          <Icon name="rupee" size={15} /> Add Expense
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveModal({ type: "photo", project: p })}
                          title="Upload inspection photo"
                        >
                          <Icon name="camera" size={15} /> Upload Photo
                        </button>
                      </>
                    ) : (
                      <Link to={`/projects/${p.projectId}`} className="btn btn-secondary btn-sm">
                        View Completed Project (Read-Only)
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: Pending Milestones & Assigned Project Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {/* Pending Milestones with direct "Mark Complete" button */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="milestone" size={20} /> Pending Project Milestones
              </div>
              <div className="card-subtitle">Stage gates requiring on-site engineer verification</div>
            </div>
            <span className="status-badge badge-blue">{pendingMilestones.length} Pending</span>
          </div>

          {pendingMilestones.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No pending stage milestones for your supervised projects.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingMilestones.map((m) => (
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
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                      Project: <strong>{m.projectName}</strong> · Target: <strong>{formatDate(m.targetDate)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {m.overdue && (
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--status-red)" }}>
                        OVERDUE
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMarkMilestoneComplete(m.projectId, m.milestoneId, m.title)}
                      title="Verify and complete milestone"
                    >
                      <Icon name="check" size={14} /> Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts & Recommendations on Supervised Projects */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="alert" size={20} /> Field Alerts & Recommendations
              </div>
              <div className="card-subtitle">Automated schedule delay flags and supervisory advice</div>
            </div>
            <span className="status-badge badge-amber">{alerts.length} Alerts</span>
          </div>

          {alerts.length === 0 && recommendations.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              No active alerts or recommendations on your supervised projects.
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.map((a) => (
                <RiskAlert key={a.id} alert={a} showProject={true} />
              ))}
              {recommendations.map((r) => (
                <RecommendationCard key={r.id} recommendation={r} showProject={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Updates I Made */}
      {recentUpdates.length > 0 && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <Icon name="activity" size={20} /> Recent Progress Logged
              </div>
              <div className="card-subtitle">Audit trail of recent field submissions</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentUpdates.slice(0, 5).map((u, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>
                    {u.projectName}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                    {formatDate(u.updateDate)} · {u.remarks || "No remarks entered"}
                  </div>
                </div>
                <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--accent-primary)" }}>
                  {u.completedPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modals */}
      {activeModal.type === "progress" && activeModal.project && (
        <UpdateProgressModal
          isOpen={true}
          projectId={activeModal.project.projectId}
          projectName={activeModal.project.name}
          currentPercentage={activeModal.project.completedPercentage}
          onClose={() => setActiveModal({ type: null, project: null })}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadData();
          }}
        />
      )}

      {activeModal.type === "expense" && activeModal.project && (
        <AddExpenseModal
          isOpen={true}
          projectId={activeModal.project.projectId}
          projectName={activeModal.project.name}
          totalBudget={activeModal.project.totalBudget}
          currentExpenditure={activeModal.project.totalExpenditure}
          onClose={() => setActiveModal({ type: null, project: null })}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadData();
          }}
        />
      )}

      {activeModal.type === "photo" && activeModal.project && (
        <UploadPhotoModal
          isOpen={true}
          projectId={activeModal.project.projectId}
          projectName={activeModal.project.name}
          onClose={() => setActiveModal({ type: null, project: null })}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadData();
          }}
        />
      )}
    </div>
  );
}
