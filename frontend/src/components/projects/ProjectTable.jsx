import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";
import Icon from "../common/Icon";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ProjectTable({
  projects = [],
  isAdmin = false,
  onDelete,
  onSort,
  sort = "createdAt",
  direction = "desc",
}) {
  const renderSortIndicator = (col) => {
    if (sort !== col) return null;
    return direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort && onSort("name")}
            >
              Project Name{renderSortIndicator("name")}
            </th>
            <th
              className="sortable"
              onClick={() => onSort && onSort("location")}
            >
              Location{renderSortIndicator("location")}
            </th>
            <th
              className="sortable"
              onClick={() => onSort && onSort("status")}
            >
              Status{renderSortIndicator("status")}
            </th>
            <th
              className="sortable"
              onClick={() => onSort && onSort("completedPercentage")}
              style={{ minWidth: 170 }}
            >
              Progress{renderSortIndicator("completedPercentage")}
            </th>
            <th>Health</th>
            <th
              className="sortable"
              onClick={() => onSort && onSort("totalBudget")}
            >
              Budget & Spent{renderSortIndicator("totalBudget")}
            </th>
            <th
              className="sortable"
              onClick={() => onSort && onSort("deadline")}
            >
              Deadline{renderSortIndicator("deadline")}
            </th>
            {isAdmin && <th>Assigned Engineer</th>}
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const isDelayed = project.status === "DELAYED";
            const planned =
              project.plannedProgress !== undefined
                ? project.plannedProgress
                : null;

            return (
              <tr
                key={project.id}
                style={{
                  backgroundColor: isDelayed ? "rgba(214, 69, 69, 0.04)" : undefined,
                }}
              >
                <td>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    <Link
                      to={`/projects/${project.id}`}
                      style={{
                        color: isDelayed ? "var(--status-red)" : "inherit",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      className="hover-underline"
                    >
                      {isDelayed && <Icon name="alert" size={14} color="var(--status-red)" />}
                      <span>{project.name}</span>
                    </Link>
                  </div>
                  {project.description && (
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        maxWidth: 240,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}
                    >
                      {project.description}
                    </div>
                  )}
                </td>
                <td>{project.location || "—"}</td>
                <td>
                  <StatusBadge status={project.status} type="project" />
                </td>
                <td>
                  <ProgressBar
                    value={project.completedPercentage}
                    planned={planned}
                    status={project.status}
                    showLabels={true}
                  />
                </td>
                <td>
                  {project.healthIndex !== undefined ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
                        {Math.round(project.healthIndex)}
                      </span>
                      <StatusBadge status={project.healthCategory} type="health" />
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                      —
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    {formatCurrency(project.totalBudget, true)}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                    Spent: {formatCurrency(project.totalExpenditure, true)} (
                    {(project.budgetUtilizationPercent || 0).toFixed(0)}%)
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: "var(--text-sm)", whiteSpace: "nowrap" }}>
                    {formatDate(project.deadline)}
                  </div>
                </td>
                {isAdmin && (
                  <td>
                    {project.assignedEngineerName ? (
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        {project.assignedEngineerName}
                      </span>
                    ) : (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                )}
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "6px" }}>
                    <Link
                      to={`/projects/${project.id}`}
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                    >
                      View
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="btn btn-secondary btn-sm"
                          title="Edit Project"
                        >
                          <Icon name="edit" size={14} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--status-red)" }}
                          title="Delete Project"
                          onClick={() => onDelete && onDelete(project.id, project.name)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
