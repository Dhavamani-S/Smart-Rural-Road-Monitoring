import { useEffect, useState } from "react";
import userService from "../services/userService";
import { getErrorMessage, getFieldErrors } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { SkeletonTable } from "../components/common/Skeleton";
import Icon from "../components/common/Icon";
import { formatDate } from "../utils/format";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Engineer Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [createGeneralError, setCreateGeneralError] = useState("");
  const [creating, setCreating] = useState(false);

  // Status toggle confirmation
  const [toggleConfirm, setToggleConfirm] = useState({
    isOpen: false,
    user: null,
    loading: false,
  });

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleCreateEngineer = async (e) => {
    e.preventDefault();
    setCreateGeneralError("");
    setFieldErrors({});

    const clientErrors = {};
    if (!form.fullName.trim()) clientErrors.fullName = "Full name is required";
    if (!form.email.trim()) clientErrors.email = "Email is required";
    if (!form.password || form.password.length < 8) {
      clientErrors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setCreating(true);
    try {
      await userService.createEngineer({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      addToast(`Site Engineer account for "${form.fullName}" created successfully!`, "success");
      setForm({ fullName: "", email: "", password: "" });
      setShowCreateModal(false);
      loadUsers();
    } catch (err) {
      const backendErrors = getFieldErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
      }
      setCreateGeneralError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleClick = (user) => {
    if (user.active) {
      setToggleConfirm({
        isOpen: true,
        user,
        loading: false,
      });
    } else {
      performToggle(user, true);
    }
  };

  const performToggle = async (user, newActiveState) => {
    try {
      await userService.setUserActive(user.id, newActiveState);
      addToast(
        `User ${user.fullName} is now ${newActiveState ? "activated" : "deactivated"}.`,
        "success"
      );
      loadUsers();
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setToggleConfirm({ isOpen: false, user: null, loading: false });
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User & Engineer Management</h1>
          <p className="page-subtitle">
            Manage system access, create site engineer credentials, and toggle account activations
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon name="plus" size={16} /> Create Site Engineer
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : error ? (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
            <Icon name="alert" size={20} />
            <div>
              <strong>Failed to load users</strong>
              <p style={{ margin: "4px 0 0" }}>{error}</p>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={loadUsers}>
            <Icon name="refresh" size={16} /> Retry
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User / Official Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdminUser = u.role === "ADMIN";

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="user-avatar-circle" style={{ width: 34, height: 34, fontSize: "var(--text-xs)" }}>
                            {u.fullName?.charAt(0) || "U"}
                          </div>
                          <strong>{u.fullName}</strong>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: isAdminUser ? "#eff6ff" : "#f0fdf4",
                            color: isAdminUser ? "#1d4ed8" : "#15803d",
                            border: `1px solid ${isAdminUser ? "#bfdbfe" : "#bbf7d0"}`,
                          }}
                        >
                          {isAdminUser ? "Administrator" : "Site Engineer"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={u.active} type="user" />
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        {!isAdminUser ? (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.active ? "btn-secondary" : "btn-primary"}`}
                            onClick={() => handleToggleClick(u)}
                            style={u.active ? { color: "var(--status-red)" } : {}}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Site Engineer Modal */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Create Site Engineer Account</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setFieldErrors({});
                  setCreateGeneralError("");
                }}
                disabled={creating}
                aria-label="Close modal"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEngineer}>
              <div className="modal-body">
                {createGeneralError && (
                  <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 16 }}>
                    <Icon name="alert" size={16} />
                    <span>{createGeneralError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required" htmlFor="engFullName">
                    Full Name
                  </label>
                  <input
                    id="engFullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleFormChange}
                    placeholder="e.g. Rajesh Kumar"
                    required
                  />
                  {fieldErrors.fullName && (
                    <div className="form-error">{fieldErrors.fullName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="engEmail">
                    Email Address
                  </label>
                  <input
                    id="engEmail"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="e.g. rajesh.kumar@smartroad.com"
                    required
                  />
                  {fieldErrors.email && (
                    <div className="form-error">{fieldErrors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="engPassword">
                    Temporary Password (min 8 characters)
                  </label>
                  <input
                    id="engPassword"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                  {fieldErrors.password && (
                    <div className="form-error">{fieldErrors.password}</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Engineer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={toggleConfirm.isOpen}
        title="Deactivate Engineer Account"
        message={`Are you sure you want to deactivate ${toggleConfirm.user?.fullName}'s account? They will no longer be able to log in or update project records until reactivated.`}
        confirmText="Deactivate Account"
        cancelText="Keep Active"
        isDanger={true}
        loading={toggleConfirm.loading}
        onConfirm={() => performToggle(toggleConfirm.user, false)}
        onCancel={() => setToggleConfirm({ isOpen: false, user: null, loading: false })}
      />
    </div>
  );
}
