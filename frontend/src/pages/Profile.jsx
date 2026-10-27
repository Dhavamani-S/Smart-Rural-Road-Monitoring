import { useEffect, useState } from "react";
import userService from "../services/userService";
import { getErrorMessage, getFieldErrors } from "../services/api";
import StatusBadge from "../components/common/StatusBadge";
import Toast from "../components/common/Toast";
import { SkeletonCard } from "../components/common/Skeleton";
import Icon from "../components/common/Icon";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordGeneralError, setPasswordGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordGeneralError("");
    setFieldErrors({});

    const clientErrors = {};
    if (!currentPassword) {
      clientErrors.currentPassword = "Current password is required";
    }
    if (!newPassword || newPassword.length < 8 || newPassword.length > 72) {
      clientErrors.newPassword = "New password must be between 8 and 72 characters";
    }
    if (newPassword !== confirmPassword) {
      clientErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setPasswordSubmitting(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      addToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const backendErrors = getFieldErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
      }
      setPasswordGeneralError(getErrorMessage(err));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="card" style={{ maxWidth: 840, margin: "0 auto", padding: "32px", textAlign: "center" }}>
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
          <Icon name="alert" size={20} />
          <div>
            <strong>Unable to load profile</strong>
            <p style={{ margin: "4px 0 0" }}>{error || "Profile information unavailable."}</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={loadProfile}>
          <Icon name="refresh" size={16} /> Retry
        </button>
      </div>
    );
  }

  const roleLabel =
    profile.role === "ADMIN"
      ? "System Administrator"
      : profile.role === "SITE_ENGINEER"
      ? "Authorized Site Engineer"
      : profile.role;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account & Security</h1>
          <p className="page-subtitle">
            Manage your personal profile details and change account authentication password
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">
            <Icon name="profile" size={20} /> Account Information
          </div>
          <StatusBadge status={profile.active} type="user" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div
            className="user-avatar-circle"
            style={{ width: 68, height: 68, fontSize: "1.75rem", flexShrink: 0 }}
          >
            {profile.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {profile.fullName}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", margin: "4px 0 8px" }}>
              {profile.email}
            </p>
            <div>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: profile.role === "ADMIN" ? "#eff6ff" : "#f0fdf4",
                  color: profile.role === "ADMIN" ? "#1d4ed8" : "#15803d",
                  border: `1px solid ${profile.role === "ADMIN" ? "#bfdbfe" : "#bbf7d0"}`,
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            padding: 18,
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              User ID
            </span>
            <div style={{ fontWeight: 600, fontSize: "var(--text-md)", marginTop: 2 }}>#{profile.id}</div>
          </div>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Email Status
            </span>
            <div style={{ fontWeight: 600, fontSize: "var(--text-md)", color: "var(--status-green)", marginTop: 2 }}>Verified Active</div>
          </div>
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Access Clearance
            </span>
            <div style={{ fontWeight: 600, fontSize: "var(--text-md)", marginTop: 2 }}>Full Operational</div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Icon name="activity" size={20} /> Update Password
            </div>
            <div className="card-subtitle">
              Secure your account by choosing a strong password (minimum 8 characters)
            </div>
          </div>
        </div>

        {passwordGeneralError && (
          <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 16 }}>
            <Icon name="alert" size={16} />
            <span>{passwordGeneralError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ maxWidth: 520 }}>
          <div className="form-group">
            <label className="form-label required" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.currentPassword) {
                  setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
                }
              }}
              placeholder="Enter current password"
              required
            />
            {fieldErrors.currentPassword && (
              <div className="form-error">{fieldErrors.currentPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="newPassword">
              New Password (8-72 characters)
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }
              }}
              placeholder="Minimum 8 characters"
              minLength={8}
              maxLength={72}
              required
            />
            {fieldErrors.newPassword && (
              <div className="form-error">{fieldErrors.newPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
              placeholder="Re-enter new password"
              required
            />
            {fieldErrors.confirmPassword && (
              <div className="form-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordSubmitting}
            >
              {passwordSubmitting ? "Changing Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
