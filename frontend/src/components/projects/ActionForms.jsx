import { useCallback, useEffect, useState } from "react";
import Icon from "../common/Icon";
import userService from "../../services/userService";
import projectService from "../../services/projectService";
import { formatCurrency, formatPercent } from "../../utils/format";

/**
 * 1. Update Progress Modal
 * Number input + range slider synced (0-100), current value shown, date default today (max today), remarks textarea.
 * Confirmation when reaching 100%: "Marking this project as complete".
 */
export function UpdateProgressModal({
  isOpen,
  projectId,
  projectName = "",
  currentPercentage = 0,
  onClose,
  onSuccess,
}) {
  const [percentage, setPercentage] = useState(currentPercentage);
  const [remarks, setRemarks] = useState("");
  const [updateDate, setUpdateDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPercentage(currentPercentage);
      setRemarks("");
      setUpdateDate(new Date().toISOString().split("T")[0]);
      setError("");
      setShowCompletionConfirm(false);
    }
  }, [isOpen, currentPercentage]);

  const isDirty = Number(percentage) !== Number(currentPercentage) || Boolean(remarks);

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm("You have unsaved progress updates. Discard changes?")) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, handleClose]);

  if (!isOpen) return null;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setPercentage(val);
    if (val === 100 && currentPercentage < 100) {
      setShowCompletionConfirm(true);
    } else {
      setShowCompletionConfirm(false);
    }
  };

  const handleNumberChange = (e) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    setPercentage(val);
    if (val === 100 && currentPercentage < 100) {
      setShowCompletionConfirm(true);
    } else {
      setShowCompletionConfirm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(percentage);

    if (Number.isNaN(num) || num < currentPercentage || num > 100) {
      setError(`Progress percentage cannot be lower than current ${currentPercentage}%, and cannot exceed 100%.`);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (updateDate > todayStr) {
      setError("Update date cannot be in the future.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await projectService.addProgress(projectId, {
        completedPercentage: num,
        remarks: remarks.trim(),
        updateDate: updateDate || undefined,
      });
      onSuccess?.(`Progress for "${projectName}" updated to ${num}%.`);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to record progress update.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Icon name="activity" size={20} /> Update Construction Progress
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)", marginBottom: 16 }}>
              Reporting field progress for <strong>{projectName}</strong>. Current verified completion is <strong>{currentPercentage}%</strong>.
            </p>

            {error && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Range Slider and Number Input */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="form-label required" htmlFor="progressNumber" style={{ margin: 0 }}>
                  Completion Percentage
                </label>
                <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--accent-primary)" }}>
                  {percentage}%
                </span>
              </div>

              <input
                type="range"
                min={currentPercentage}
                max={100}
                value={percentage}
                onChange={handleSliderChange}
                style={{ width: "100%", marginBottom: 12 }}
                disabled={submitting}
              />

              <input
                id="progressNumber"
                type="number"
                min={currentPercentage}
                max={100}
                value={percentage}
                onChange={handleNumberChange}
                required
                disabled={submitting}
              />
              <span className="form-help">
                Must be at least {currentPercentage}% (progress cannot decrease).
              </span>
            </div>

            {/* 100% Completion Notice */}
            {showCompletionConfirm && (
              <div
                style={{
                  padding: 12,
                  background: "var(--status-green-bg)",
                  border: "1px solid var(--status-green-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "#065f46",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="check" size={18} />
                <span>Marking this project as complete (100%). All stage works finished.</span>
              </div>
            )}

            {/* Date Input */}
            <div className="form-group">
              <label className="form-label required" htmlFor="progressDate">
                Inspection / Update Date
              </label>
              <input
                id="progressDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Remarks */}
            <div className="form-group">
              <label className="form-label" htmlFor="progressRemarks">
                Field Observations & Chainage Details
              </label>
              <textarea
                id="progressRemarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Granular sub-base layer laid from Ch 2+100 to Ch 4+200. Compaction test passed."
                disabled={submitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Recording..." : "Save Progress Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Add Expense Modal
 * Amount (>0, INR), category select with friendly labels, date (default today), description.
 * Warns if budget crosses 90% or 100%.
 */
export function AddExpenseModal({
  isOpen,
  projectId,
  projectName = "",
  totalBudget = 0,
  currentExpenditure = 0,
  onClose,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("MATERIAL");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setCategory("MATERIAL");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  const isDirty = Boolean(amount || description);

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm("You have entered expense information. Discard without saving?")) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);

    if (Number.isNaN(num) || num <= 0) {
      setError("Expense amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await projectService.addExpense(projectId, {
        amount: num,
        category,
        expenseDate: expenseDate || undefined,
        description: description.trim(),
      });

      const newTotal = (currentExpenditure || 0) + num;
      const newPct = totalBudget > 0 ? (newTotal / totalBudget) * 100 : 0;

      let warningMessage = "";
      if (newPct > 100) {
        warningMessage = ` ⚠️ Project budget exceeded (${formatPercent(newPct, 1)} utilised)!`;
      } else if (newPct >= 90) {
        warningMessage = ` ⚠️ Budget utilization reached ${formatPercent(newPct, 1)}!`;
      }

      onSuccess?.(`Expense of ${formatCurrency(num)} recorded successfully.${warningMessage}`);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to record expense.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Icon name="rupee" size={20} /> Record Project Expense
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)", marginBottom: 16 }}>
              Project: <strong>{projectName}</strong> · Sanctioned Budget: <strong>{formatCurrency(totalBudget)}</strong>
            </p>

            {error && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {/* Amount */}
              <div className="form-group">
                <label className="form-label required" htmlFor="expenseAmount">
                  Amount (INR ₹)
                </label>
                <input
                  id="expenseAmount"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 75000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label required" htmlFor="expenseCategory">
                  Expense Category
                </label>
                <select
                  id="expenseCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="MATERIAL">Materials (Bitumen, aggregate, cement)</option>
                  <option value="LABOUR">Labour & Workforce</option>
                  <option value="EQUIPMENT">Machinery & Equipment rental</option>
                  <option value="TRANSPORT">Haulage & Transport</option>
                  <option value="PERMITS">Permits & Statutory Approvals</option>
                  <option value="OTHER">Other Project Expenses</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label required" htmlFor="expenseDate">
                Date Incurred
              </label>
              <input
                id="expenseDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="expenseDescription">
                Description & Voucher Reference
              </label>
              <textarea
                id="expenseDescription"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Purchase of 40 MT crushed stone aggregate - Voucher #V-2026-88"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Upload Photo Modal
 * File picker (JPEG, PNG, WebP only, max 5 MB, validated before upload),
 * phone camera support: <input type="file" accept="image/*" capture="environment">,
 * image preview, caption (max 200 chars), upload progress indicator.
 */
export function UploadPhotoModal({
  isOpen,
  projectId,
  projectName = "",
  onClose,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl("");
      setCaption("");
      setError("");
    }
  }, [isOpen]);

  const isDirty = Boolean(selectedFile || caption);

  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm("Discard selected photo?")) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, handleClose]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5 MB. Please select a compressed image.");
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        setError("Invalid format. Only JPEG, PNG, and WebP images are permitted.");
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }
      setError("");
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please choose or capture a photo first.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await projectService.uploadPhoto(projectId, selectedFile, caption.trim());
      onSuccess?.(`Site photo uploaded successfully for "${projectName}".`);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to upload photo.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Icon name="photo" size={20} /> Upload Construction Photo
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "var(--text-md)", color: "var(--text-secondary)", marginBottom: 16 }}>
              Project: <strong>{projectName}</strong>
            </p>

            {error && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* File & Camera Input */}
            <div className="form-group">
              <label className="form-label required" htmlFor="photoPicker">
                Select Photo or Use Phone Camera (JPEG, PNG, WebP ≤ 5 MB)
              </label>
              <input
                id="photoPicker"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                disabled={submitting}
                required
              />
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div
                style={{
                  margin: "12px 0 16px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  maxHeight: "220px",
                  display: "flex",
                  justifyContent: "center",
                  background: "#0f172a",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: "220px", width: "auto", objectFit: "contain" }}
                />
              </div>
            )}

            {/* Caption */}
            <div className="form-group">
              <label className="form-label" htmlFor="photoCaption">
                Caption / Description (Max 200 characters)
              </label>
              <input
                id="photoCaption"
                type="text"
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Cross drainage pipe culvert installation at Ch 5+600"
                disabled={submitting}
              />
              <span className="form-help">{caption.length} / 200 characters</span>
            </div>

            {/* Progress indicator */}
            {submitting && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>
                  Uploading high-resolution field photo to server...
                </div>
                <div className="skeleton" style={{ height: 8 }} />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !selectedFile}
            >
              {submitting ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. Hold / Resume Modal
 */
export function ChangeStatusModal({
  isOpen,
  currentStatus,
  projectName = "",
  onClose,
  onChangeStatus,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCurrentlyOnHold = currentStatus === "ON_HOLD";
  const targetStatus = isCurrentlyOnHold ? "IN_PROGRESS" : "ON_HOLD";
  const actionTitle = isCurrentlyOnHold ? "Resume Project Work" : "Put Project On Hold";

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onChangeStatus(targetStatus);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update project status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{actionTitle}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {isCurrentlyOnHold ? (
              <>
                Are you ready to resume active construction on <strong>{projectName}</strong>? The status will transition to <strong>IN PROGRESS</strong>.
              </>
            ) : (
              <>
                Are you sure you want to put <strong>{projectName}</strong> on hold? This will notify administration and temporarily halt construction milestones.
              </>
            )}
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isCurrentlyOnHold ? "btn-primary" : "btn-warning"}`}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Updating..." : actionTitle}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Admin Assign Engineer Modal
 */
export function AssignEngineerModal({
  isOpen,
  currentEngineerId = null,
  projectName = "",
  onClose,
  onAssign,
}) {
  const [engineers, setEngineers] = useState([]);
  const [selectedId, setSelectedId] = useState(currentEngineerId || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      userService
        .getEngineers()
        .then((data) => setEngineers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onAssign(selectedId ? Number(selectedId) : null);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update engineer assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Assign Site Engineer</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginBottom: 16 }}>
              Select a qualified site engineer to supervise <strong>{projectName}</strong>.
            </p>

            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="engineerSelect">
                Site Engineer
              </label>
              <select
                id="engineerSelect"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Unassign Project —</option>
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.fullName} ({eng.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
