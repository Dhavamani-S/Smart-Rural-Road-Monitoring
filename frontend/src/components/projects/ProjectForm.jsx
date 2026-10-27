import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import { getErrorMessage, getFieldErrors } from "../../services/api";
import { PROJECT_STATUS, PROJECT_STATUS_META } from "../../utils/constants";
import Icon from "../common/Icon";

export default function ProjectForm({
  initialData = null,
  isEdit = false,
  onSubmit,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    totalBudget: "",
    startDate: "",
    deadline: "",
    status: PROJECT_STATUS.NOT_STARTED,
    assignedEngineerId: "",
  });

  const [engineers, setEngineers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    // Load engineers list for assignment
    userService
      .getEngineers()
      .then((data) => setEngineers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        location: initialData.location || "",
        description: initialData.description || "",
        totalBudget: initialData.totalBudget || "",
        startDate: initialData.startDate || "",
        deadline: initialData.deadline || "",
        status: initialData.status || PROJECT_STATUS.NOT_STARTED,
        assignedEngineerId: initialData.assignedEngineerId || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Project name is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.totalBudget || Number(formData.totalBudget) <= 0) {
      errors.totalBudget = "Budget must be greater than zero";
    }
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.deadline) errors.deadline = "Deadline is required";
    if (
      formData.startDate &&
      formData.deadline &&
      formData.deadline <= formData.startDate
    ) {
      errors.deadline = "Deadline must be after start date";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      description: formData.description.trim() || null,
      totalBudget: Number(formData.totalBudget),
      startDate: formData.startDate,
      deadline: formData.deadline,
      status: formData.status || undefined,
      assignedEngineerId: formData.assignedEngineerId
        ? Number(formData.assignedEngineerId)
        : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const backendFieldErrors = getFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors(backendFieldErrors);
      }
      setGeneralError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 840, margin: "0 auto" }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            <Icon name={isEdit ? "edit" : "plus"} size={20} />
            {isEdit ? "Edit Project Details" : "Create New Road Project"}
          </div>
          <div className="card-subtitle">
            {isEdit
              ? "Update rural road project parameters, schedule, or assignment"
              : "Register a new rural road construction project in the system"}
          </div>
        </div>
      </div>

      {generalError && (
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 20 }}>
          <Icon name="alert" size={16} />
          <span>{generalError}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Project Name */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label required" htmlFor="name">
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Rural Road - Village A to Highway"
            required
          />
          {fieldErrors.name && (
            <div className="form-error">{fieldErrors.name}</div>
          )}
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label required" htmlFor="location">
            Location / District
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Village A, Block 3, District B"
            required
          />
          {fieldErrors.location && (
            <div className="form-error">{fieldErrors.location}</div>
          )}
        </div>

        {/* Total Budget */}
        <div className="form-group">
          <label className="form-label required" htmlFor="totalBudget">
            Total Budget (₹)
          </label>
          <input
            id="totalBudget"
            name="totalBudget"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.totalBudget}
            onChange={handleChange}
            placeholder="e.g. 12000000"
            required
          />
          {fieldErrors.totalBudget && (
            <div className="form-error">{fieldErrors.totalBudget}</div>
          )}
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label className="form-label required" htmlFor="startDate">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
          {fieldErrors.startDate && (
            <div className="form-error">{fieldErrors.startDate}</div>
          )}
        </div>

        {/* Deadline */}
        <div className="form-group">
          <label className="form-label required" htmlFor="deadline">
            Project Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            min={formData.startDate || undefined}
            required
          />
          {fieldErrors.deadline && (
            <div className="form-error">{fieldErrors.deadline}</div>
          )}
        </div>

        {/* Assigned Site Engineer */}
        <div className="form-group">
          <label className="form-label" htmlFor="assignedEngineerId">
            Assigned Site Engineer
          </label>
          <select
            id="assignedEngineerId"
            name="assignedEngineerId"
            value={formData.assignedEngineerId}
            onChange={handleChange}
          >
            <option value="">— Unassigned —</option>
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.fullName} ({eng.email})
              </option>
            ))}
          </select>
          {fieldErrors.assignedEngineerId && (
            <div className="form-error">{fieldErrors.assignedEngineerId}</div>
          )}
        </div>

        {/* Status (Edit only) */}
        {isEdit && (
          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Project Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {Object.keys(PROJECT_STATUS).map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_META[s]?.label || s}
                </option>
              ))}
            </select>
            {fieldErrors.status && (
              <div className="form-error">{fieldErrors.status}</div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label" htmlFor="description">
            Project Description & Scope
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of road construction length, chainage, alignment and specifications..."
            maxLength={2000}
          />
          {fieldErrors.description && (
            <div className="form-error">{fieldErrors.description}</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : isEdit
            ? "Update Project"
            : "Create Project"}
        </button>
      </div>
    </form>
  );
}
