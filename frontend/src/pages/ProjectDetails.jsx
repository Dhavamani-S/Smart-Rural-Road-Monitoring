import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import projectService from "../services/projectService";
import { getErrorMessage } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import ProgressBar from "../components/common/ProgressBar";
import Toast from "../components/common/Toast";
import Icon from "../components/common/Icon";
import SkeletonDashboard from "../components/common/Skeleton";
import HealthIndexCard from "../components/health/HealthIndexCard";
import RiskAlert from "../components/alerts/RiskAlert";
import RecommendationCard from "../components/alerts/RecommendationCard";
import MilestoneTimeline from "../components/projects/MilestoneTimeline";
import ProgressHistory from "../components/projects/ProgressHistory";
import ExpenseTable from "../components/projects/ExpenseTable";
import PhotoGallery from "../components/projects/PhotoGallery";
import {
  AssignEngineerModal,
  ChangeStatusModal,
  UpdateProgressModal,
  AddExpenseModal,
  UploadPhotoModal,
} from "../components/projects/ActionForms";
import { ExpenseCategoryDoughnutChart } from "../components/charts/ChartComponents";
import { formatCurrency, formatDate, formatPercent } from "../utils/format";

export default function ProjectDetails() {
  const { id } = useParams();
  const { user, isAdmin, isEngineer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "overview";

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // "progress" | "expense" | "photo" | "status" | "assign"
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
  };

  const removeToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  // Check query params for creation or update feedback
  useEffect(() => {
    if (searchParams.get("created") === "1") {
      addToast("Project successfully created!", "success");
      searchParams.delete("created");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("updated") === "1") {
      addToast("Project successfully updated!", "success");
      searchParams.delete("updated");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load project details and full report data
  const loadProjectData = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsForbidden(false);

    try {
      const reportData = await projectService.getProjectReport(id);
      setData(reportData);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  // 403 Friendly Error Message
  if (isForbidden) {
    return (
      <div className="card" style={{ maxWidth: 620, margin: "48px auto", textAlign: "center", padding: "40px 32px" }}>
        <div className="empty-state-icon" style={{ margin: "0 auto 16px", backgroundColor: "var(--status-amber-bg)", color: "var(--status-amber)" }}>
          <Icon name="alert" size={36} />
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)" }}>
          This Project is Not Assigned to You
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", lineHeight: 1.6, marginBottom: "24px" }}>
          In SmartRoad, site engineers can only access rural road projects assigned to their supervision by the administration.
        </p>
        <Link to="/projects" className="btn btn-primary">
          ← Back to My Assigned Projects
        </Link>
      </div>
    );
  }

  if (error || !data || !data.project) {
    return (
      <div className="card" style={{ maxWidth: 620, margin: "48px auto", textAlign: "center", padding: "40px 32px" }}>
        <div className="empty-state-icon" style={{ margin: "0 auto 16px", backgroundColor: "var(--status-red-bg)", color: "var(--status-red)" }}>
          <Icon name="alert" size={36} />
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, marginBottom: "12px" }}>
          Cannot Reach Road Project
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", marginBottom: "24px" }}>
          {error || "The requested road project does not exist or has been removed."}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={loadProjectData}>
            <Icon name="refresh" size={16} /> Retry
          </button>
          <Link to="/projects" className="btn btn-secondary">
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  const {
    project,
    timeline,
    health,
    budget,
    milestones = [],
    progressHistory = [],
    expenses = [],
    photos = [],
    alerts = [],
    recommendations = [],
  } = data;

  const isCompleted = project.status === "COMPLETED";

  // Actions
  const handleAssignEngineer = async (engineerId) => {
    await projectService.assignEngineer(project.id, engineerId);
    addToast("Engineer assignment updated successfully.", "success");
    loadProjectData();
  };

  const handleStatusChange = async (newStatus) => {
    await projectService.updateProjectStatus(project.id, newStatus);
    addToast(`Project status changed to ${newStatus.replace("_", " ")}.`, "success");
    loadProjectData();
  };

  const handleCompleteMilestone = async (milestoneId) => {
    await projectService.completeMilestone(project.id, milestoneId);
    addToast("Milestone marked as complete.", "success");
    loadProjectData();
  };

  const handleAddMilestone = async (milestonePayload) => {
    await projectService.createMilestone(project.id, milestonePayload);
    addToast("Milestone created successfully.", "success");
    loadProjectData();
  };

  const handleDeleteMilestone = async (milestoneId) => {
    await projectService.deleteMilestone(project.id, milestoneId);
    addToast("Milestone deleted successfully.", "success");
    loadProjectData();
  };

  const handleDeletePhoto = async (photoId) => {
    await projectService.deletePhoto(project.id, photoId);
    addToast("Site photo removed successfully.", "success");
    loadProjectData();
  };

  // Schedule sentence calculation: "N points behind plan" or "On or ahead of plan"
  const progressGap = timeline?.progressGap ?? 0;
  const scheduleSentence = progressGap > 0
    ? `${progressGap.toFixed(1)} points behind sanctioned plan`
    : "On or ahead of sanctioned construction plan";

  return (
    <div>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Sticky Action Bar */}
      <div className="sticky-action-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
            {project.name}
          </div>
          <StatusBadge status={project.status} type="project" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {!isCompleted ? (
            <>
              {isEngineer && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveModal("progress")}
                  >
                    <Icon name="activity" size={15} /> Update Progress
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModal("expense")}
                  >
                    <Icon name="rupee" size={15} /> Add Expense
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModal("photo")}
                  >
                    <Icon name="camera" size={15} /> Upload Photo
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${project.status === "ON_HOLD" ? "btn-primary" : "btn-warning"}`}
                    onClick={() => setActiveModal("status")}
                  >
                    {project.status === "ON_HOLD" ? "Resume Work" : "Put On Hold"}
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModal("assign")}
                  >
                    <Icon name="users" size={15} /> Assign Engineer
                  </button>
                  <Link to={`/projects/${project.id}/edit`} className="btn btn-secondary btn-sm">
                    <Icon name="edit" size={15} /> Edit
                  </Link>
                </>
              )}
            </>
          ) : (
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "#065f46",
                fontWeight: 600,
                background: "var(--status-green-bg)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              ✓ Project Completed (Read-Only)
            </span>
          )}

          <Link to={`/reports/${project.id}`} className="btn btn-secondary btn-sm">
            <Icon name="printer" size={15} /> Report
          </Link>
        </div>
      </div>

      {/* Completed Project Read-Only Banner */}
      {isCompleted && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--status-green-bg)",
            border: "1px solid var(--status-green-border)",
            borderRadius: "var(--radius-md)",
            color: "#065f46",
            fontSize: "var(--text-md)",
            fontWeight: 600,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Icon name="check" size={20} />
          <span>This project is completed and read-only. Field logging has concluded.</span>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, margin: 0 }}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} type="project" />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <span>📍 {project.location || "Location unspecified"}</span>
              <span>·</span>
              <span>
                Supervising Engineer:{" "}
                <strong>{project.assignedEngineerName || "Unassigned"}</strong>
              </span>
            </p>
            {project.description && (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: "10px", lineHeight: 1.6 }}>
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* 4 Stat Cards: Completed %, Days Remaining, Budget, Spent */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Completion Progress
            </span>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--accent-primary)", marginTop: 4 }}>
              {project.completedPercentage}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Sanctioned Budget
            </span>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginTop: 4 }}>
              {formatCurrency(project.totalBudget)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Expenditure Recorded
            </span>
            <div
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: 800,
                marginTop: 4,
                color: (project.budgetUtilizationPercent || 0) > 100 ? "var(--status-red)" : "inherit",
              }}
            >
              {formatCurrency(project.totalExpenditure)} ({formatPercent(project.budgetUtilizationPercent, 0)})
            </div>
          </div>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Schedule Timeframe
            </span>
            <div
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: 800,
                marginTop: 4,
                color: (timeline?.remainingDays ?? 0) < 0 ? "var(--status-red)" : "inherit",
              }}
            >
              {timeline ? `${timeline.remainingDays} Days` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="tab-navigation" aria-label="Project workspace tabs">
        <button
          type="button"
          className={`tab-btn ${currentTab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          <Icon name="dashboard" size={18} /> Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${currentTab === "analysis" ? "active" : ""}`}
          onClick={() => setTab("analysis")}
        >
          <Icon name="activity" size={18} /> Analysis & Health
        </button>
        <button
          type="button"
          className={`tab-btn ${currentTab === "progress" ? "active" : ""}`}
          onClick={() => setTab("progress")}
        >
          <Icon name="projects" size={18} /> Progress ({project.completedPercentage}%)
        </button>
        <button
          type="button"
          className={`tab-btn ${currentTab === "milestones" ? "active" : ""}`}
          onClick={() => setTab("milestones")}
        >
          <Icon name="milestone" size={18} /> Milestones ({milestones.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${currentTab === "expenses" ? "active" : ""}`}
          onClick={() => setTab("expenses")}
        >
          <Icon name="rupee" size={18} /> Expenses ({expenses.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${currentTab === "photos" ? "active" : ""}`}
          onClick={() => setTab("photos")}
        >
          <Icon name="photo" size={18} /> Photos ({photos.length})
        </button>
      </nav>

      {/* Tab 1: Overview */}
      {currentTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Construction Schedule & Gap Analysis */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Construction Timeline & Delivery Target</div>
                <div className="card-subtitle">
                  Commenced: <strong>{formatDate(project.startDate)}</strong> · Target Deadline: <strong>{formatDate(project.deadline)}</strong>
                </div>
              </div>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  color: progressGap > 0 ? "var(--status-amber)" : "var(--status-green)",
                }}
              >
                {scheduleSentence}
              </span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <ProgressBar
                value={project.completedPercentage}
                planned={timeline?.plannedProgress}
                status={project.status}
                showLabels={true}
                label="Actual Construction vs Planned Schedule"
              />
            </div>

            {timeline && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                  background: "var(--bg-subtle)",
                  padding: "16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "var(--text-xs)" }}>TOTAL TIMELINE</span>
                  <strong style={{ fontSize: "var(--text-md)" }}>{timeline.totalDays} Days</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "var(--text-xs)" }}>ELAPSED DAYS</span>
                  <strong style={{ fontSize: "var(--text-md)" }}>{timeline.elapsedDays} Days</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "var(--text-xs)" }}>REMAINING DAYS</span>
                  <strong
                    style={{
                      fontSize: "var(--text-md)",
                      color: timeline.remainingDays < 0 ? "var(--status-red)" : "inherit",
                    }}
                  >
                    {timeline.remainingDays} Days
                  </strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "var(--text-xs)" }}>SCHEDULE GAP</span>
                  <strong
                    style={{
                      fontSize: "var(--text-md)",
                      color: timeline.progressGap > 0 ? "var(--status-amber)" : "var(--status-green)",
                    }}
                  >
                    {timeline.progressGap > 0 ? `-${timeline.progressGap.toFixed(1)}%` : "On Schedule"}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Road Health Index Prominent Gauge & Breakdown */}
          <HealthIndexCard health={health} />

          {/* Priority Alerts & Actionable Recommendations */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Icon name="alert" size={18} /> Active Alerts ({alerts.length})
                  </div>
                  <div className="card-subtitle">Delay breaches and budget variance flags</div>
                </div>
              </div>
              {alerts.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  No active risk alerts detected for this project.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {alerts.map((alert) => (
                    <RiskAlert key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Icon name="activity" size={18} /> What You Should Do Next
                  </div>
                  <div className="card-subtitle">Actionable supervisory guidance from decision engine</div>
                </div>
              </div>
              {recommendations.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  No outstanding recommendations for this project.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Analysis & Health */}
      {currentTab === "analysis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <HealthIndexCard health={health} />

          {budget && budget.analysis && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Icon name="rupee" size={20} /> Budget Risk Analysis & EVM Metrics
                  </div>
                  <div className="card-subtitle">
                    Financial risk status:{" "}
                    <span
                      className={`status-badge ${
                        budget.analysis.status === "OVER_BUDGET"
                          ? "badge-red"
                          : budget.analysis.status === "SPENDING_AHEAD_OF_WORK"
                          ? "badge-amber"
                          : "badge-green"
                      }`}
                    >
                      {budget.analysis.status?.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ padding: "14px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Earned Value (EV)
                    </div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>
                      {formatCurrency(budget.analysis.earnedValue)}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>
                      Value of physical work delivered based on completion %
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Cost Efficiency Index (CEI / CPI)
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xl)",
                        fontWeight: 700,
                        color: (budget.analysis.costEfficiencyIndex || 0) < 1 ? "var(--status-amber)" : "var(--status-green)",
                      }}
                    >
                      {budget.analysis.costEfficiencyIndex !== null ? budget.analysis.costEfficiencyIndex.toFixed(2) : "N/A"}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>
                      &gt;1.0 within plan, &lt;1.0 spending ahead of physical progress
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Automated Plain-English Interpretation
                    </div>
                    <div style={{ fontSize: "var(--text-base)", color: "var(--text-primary)", marginTop: 4, lineHeight: 1.5 }}>
                      {budget.analysis.interpretation}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Expense Distribution by Category
                  </div>
                  <ExpenseCategoryDoughnutChart
                    expenseDistribution={budget.expenseByCategory || {}}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Progress */}
      {currentTab === "progress" && (
        <ProgressHistory
          history={progressHistory}
          currentPercentage={project.completedPercentage}
          isEngineer={isEngineer}
          isCompleted={isCompleted}
          onOpenAddModal={() => setActiveModal("progress")}
        />
      )}

      {/* Tab 4: Milestones */}
      {currentTab === "milestones" && (
        <MilestoneTimeline
          milestones={milestones}
          isAdmin={isAdmin}
          isEngineer={isEngineer}
          onComplete={handleCompleteMilestone}
          onDelete={handleDeleteMilestone}
          onAddMilestone={handleAddMilestone}
        />
      )}

      {/* Tab 5: Expenses */}
      {currentTab === "expenses" && (
        <ExpenseTable
          expenses={expenses}
          isEngineer={isEngineer}
          isCompleted={isCompleted}
          onOpenAddModal={() => setActiveModal("expense")}
        />
      )}

      {/* Tab 6: Photos */}
      {currentTab === "photos" && (
        <PhotoGallery
          photos={photos}
          isEngineer={isEngineer}
          isAdmin={isAdmin}
          currentUserName={user?.fullName}
          onOpenUploadModal={() => setActiveModal("photo")}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* 4 Action Modals & Admin Assign Modal */}
      {activeModal === "progress" && (
        <UpdateProgressModal
          isOpen={true}
          projectId={project.id}
          projectName={project.name}
          currentPercentage={project.completedPercentage}
          onClose={() => setActiveModal(null)}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadProjectData();
          }}
        />
      )}

      {activeModal === "expense" && (
        <AddExpenseModal
          isOpen={true}
          projectId={project.id}
          projectName={project.name}
          totalBudget={project.totalBudget}
          currentExpenditure={project.totalExpenditure}
          onClose={() => setActiveModal(null)}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadProjectData();
          }}
        />
      )}

      {activeModal === "photo" && (
        <UploadPhotoModal
          isOpen={true}
          projectId={project.id}
          projectName={project.name}
          onClose={() => setActiveModal(null)}
          onSuccess={(msg) => {
            addToast(msg, "success");
            loadProjectData();
          }}
        />
      )}

      {activeModal === "status" && (
        <ChangeStatusModal
          isOpen={true}
          currentStatus={project.status}
          projectName={project.name}
          onClose={() => setActiveModal(null)}
          onChangeStatus={handleStatusChange}
        />
      )}

      {activeModal === "assign" && (
        <AssignEngineerModal
          isOpen={true}
          currentEngineerId={project.assignedEngineerId}
          projectName={project.name}
          onClose={() => setActiveModal(null)}
          onAssign={handleAssignEngineer}
        />
      )}
    </div>
  );
}
