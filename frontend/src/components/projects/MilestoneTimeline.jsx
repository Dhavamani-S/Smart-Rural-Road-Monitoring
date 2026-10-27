import { useState } from "react";
import Icon from "../common/Icon";
import { formatDate } from "../../utils/format";

export default function MilestoneTimeline({
  milestones = [],
  isAdmin = false,
  isEngineer = false,
  onComplete,
  onDelete,
  onAddMilestone,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) {
      setError("Please provide title and target date.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onAddMilestone({ title: title.trim(), targetDate });
      setTitle("");
      setTargetDate("");
      setShowAddForm(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create milestone.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Icon name="milestone" size={18} /> Project Milestones
          </div>
          <div className="card-subtitle">
            Track key construction stages and completion targets
          </div>
        </div>
        {isAdmin && !showAddForm && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(true)}
          >
            <Icon name="plus" size={14} /> Add Milestone
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "12px" }}>
            Add New Milestone
          </div>
          {error && <div className="form-error" style={{ marginBottom: "10px" }}>{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label className="form-label required">Milestone Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sub-base layer completion"
                required
              />
            </div>
            <div>
              <label className="form-label required">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowAddForm(false);
                setError("");
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Milestone"}
            </button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
          No milestones defined for this project.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {milestones.map((m) => {
            const isCompleted = m.completed;
            const isOverdue = !isCompleted && m.targetDate && m.targetDate < today;

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  borderColor: isCompleted
                    ? "var(--status-green-border)"
                    : isOverdue
                    ? "var(--status-red-border)"
                    : "var(--border-color)",
                  backgroundColor: isCompleted
                    ? "var(--status-green-bg)"
                    : isOverdue
                    ? "var(--status-red-bg)"
                    : "var(--bg-subtle)",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 200 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isCompleted
                        ? "var(--status-green)"
                        : isOverdue
                        ? "var(--status-red)"
                        : "#cbd5e1",
                      color: "#ffffff",
                    }}
                  >
                    <Icon name={isCompleted ? "check" : isOverdue ? "alert" : "flag"} size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      Target: <strong>{formatDate(m.targetDate)}</strong>
                      {isCompleted && m.completedDate && (
                        <span> · Completed on {formatDate(m.completedDate)}</span>
                      )}
                      {isOverdue && (
                        <span style={{ color: "var(--status-red)", fontWeight: 700, marginLeft: 6 }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isEngineer && !isCompleted && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onComplete && onComplete(m.id)}
                      title="Mark Milestone as Completed"
                    >
                      <Icon name="check" size={14} /> Mark Complete
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--status-red)" }}
                      onClick={() => onDelete && onDelete(m.id)}
                      title="Delete Milestone"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
