import { useCallback, useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import projectService from "../services/projectService";
import { getErrorMessage } from "../services/api";
import ExpenseTable from "../components/projects/ExpenseTable";
import { ExpenseCategoryDoughnutChart } from "../components/charts/ChartComponents";
import StatCard from "../components/common/StatCard";
import SkeletonDashboard from "../components/common/Skeleton";
import Toast from "../components/common/Toast";
import Icon from "../components/common/Icon";
import { AddExpenseModal } from "../components/projects/ActionForms";
import { formatCurrency, formatPercent } from "../utils/format";

export default function Expenses() {
  const { isEngineer } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load project list on mount (backend scopes to assigned for site engineer)
  useEffect(() => {
    setLoadingProjects(true);
    projectService
      .getProjects()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.content || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Fetch expenses for chosen project
  const loadExpensesForProject = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoadingExpenses(true);
    setError("");

    try {
      const [projData, expData] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getExpenses(projectId),
      ]);
      setSelectedProject(projData);
      setExpenses(Array.isArray(expData) ? expData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadExpensesForProject(selectedProjectId);
    }
  }, [selectedProjectId, loadExpensesForProject]);

  const totalExpenditure = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0
  );

  const categoryDistribution = expenses.reduce((acc, exp) => {
    const cat = exp.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0);
    return acc;
  }, {});

  if (loadingProjects) {
    return <SkeletonDashboard />;
  }

  const isCompleted = selectedProject?.status === "COMPLETED";

  return (
    <div>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Expense Ledger</h1>
          <p className="page-subtitle">
            Track categorized disbursements across materials, labour, equipment hire, and transportation
          </p>
        </div>
        {selectedProject && isEngineer && !isCompleted && (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Icon name="plus" size={16} /> Add Expense
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card">
          <div className="auth-alert auth-alert-error" role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Project Selector Bar */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <label htmlFor="projectPicker" style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            Select Road Project:
          </label>
          <select
            id="projectPicker"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ maxWidth: 440 }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.location || "Rural Road"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingExpenses ? (
        <SkeletonDashboard />
      ) : selectedProject ? (
        <div>
          {/* Financial Stat Cards */}
          <div className="stat-card-grid">
            <StatCard
              title="Allocated Budget"
              value={formatCurrency(selectedProject.totalBudget)}
              subtitle="Total project sanction"
              icon="rupee"
              tone="blue"
            />
            <StatCard
              title="Total Recorded Expenses"
              value={formatCurrency(totalExpenditure)}
              subtitle={`${expenses.length} expense transactions`}
              icon="expenses"
              tone="green"
            />
            <StatCard
              title="Remaining Balance"
              value={formatCurrency(
                Number(selectedProject.totalBudget) - totalExpenditure
              )}
              subtitle="Unspent project funds"
              icon="rupee"
              tone={
                Number(selectedProject.totalBudget) - totalExpenditure < 0
                  ? "red"
                  : "gray"
              }
            />
            <StatCard
              title="Budget Utilisation"
              value={formatPercent(
                selectedProject.totalBudget > 0
                  ? (totalExpenditure / Number(selectedProject.totalBudget)) * 100
                  : 0,
                1
              )}
              subtitle="Expenditure vs total allocation"
              icon="activity"
              tone={
                totalExpenditure > Number(selectedProject.totalBudget)
                  ? "red"
                  : (totalExpenditure / Number(selectedProject.totalBudget)) * 100 >= 85
                  ? "amber"
                  : "blue"
              }
            />
          </div>

          {/* Chart & Expense List */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", marginBottom: "24px" }}>
            {/* Category Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Expense Category Breakdown</div>
                  <div className="card-subtitle">Spending distribution across materials, labour & plant</div>
                </div>
              </div>
              <div style={{ height: "260px" }}>
                <ExpenseCategoryDoughnutChart
                  expenseDistribution={categoryDistribution}
                />
              </div>
            </div>

            {/* Quick Project Summary */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Project Status & Verification</div>
                  <div className="card-subtitle">{selectedProject.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "var(--text-base)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Status</span>
                  <strong>{selectedProject.status?.replaceAll("_", " ")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Completion Progress</span>
                  <strong>{selectedProject.completedPercentage}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Assigned Engineer</span>
                  <strong>{selectedProject.assignedEngineerName || "Unassigned"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span style={{ color: "var(--text-muted)" }}>Policy Rule</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    {isCompleted
                      ? "Completed projects are read-only"
                      : "Site engineers can record field expenses"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <ExpenseTable
            expenses={expenses}
            isEngineer={isEngineer}
            isCompleted={isCompleted}
            onOpenAddModal={() => setIsModalOpen(true)}
          />

          {/* Add Expense Modal */}
          {isModalOpen && (
            <AddExpenseModal
              isOpen={true}
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              totalBudget={selectedProject.totalBudget}
              currentExpenditure={totalExpenditure}
              onClose={() => setIsModalOpen(false)}
              onSuccess={(msg) => {
                addToast(msg, "success");
                loadExpensesForProject(selectedProjectId);
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
