export const ROLES = {
  ADMIN: "ADMIN",
  SITE_ENGINEER: "SITE_ENGINEER",
};

export const PROJECT_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  DELAYED: "DELAYED",
  COMPLETED: "COMPLETED",
  ON_HOLD: "ON_HOLD",
};

export const PROJECT_STATUS_META = {
  NOT_STARTED: {
    label: "Not Started",
    badgeClass: "badge-gray",
    color: "#64748b",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "badge-blue",
    color: "#2563eb",
  },
  DELAYED: {
    label: "Delayed",
    badgeClass: "badge-red",
    color: "#dc2626",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "badge-green",
    color: "#16a34a",
  },
  ON_HOLD: {
    label: "On Hold",
    badgeClass: "badge-amber",
    color: "#d97706",
  },
};

export const EXPENSE_CATEGORIES = {
  MATERIAL: "MATERIAL",
  LABOUR: "LABOUR",
  EQUIPMENT: "EQUIPMENT",
  TRANSPORT: "TRANSPORT",
  PERMITS: "PERMITS",
  OTHER: "OTHER",
};

export const EXPENSE_CATEGORY_META = {
  MATERIAL: { label: "Materials", color: "#3b82f6" },
  LABOUR: { label: "Labour", color: "#10b981" },
  EQUIPMENT: { label: "Equipment", color: "#f59e0b" },
  TRANSPORT: { label: "Transport", color: "#8b5cf6" },
  PERMITS: { label: "Permits & Fees", color: "#ec4899" },
  OTHER: { label: "Other", color: "#6b7280" },
};

export const HEALTH_CATEGORIES = {
  HEALTHY: "HEALTHY",
  NEEDS_ATTENTION: "NEEDS_ATTENTION",
  CRITICAL: "CRITICAL",
};

export const HEALTH_CATEGORY_META = {
  HEALTHY: {
    label: "Healthy",
    badgeClass: "badge-green",
    color: "#16a34a",
    minScore: 80,
  },
  NEEDS_ATTENTION: {
    label: "Needs Attention",
    badgeClass: "badge-amber",
    color: "#d97706",
    minScore: 60,
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "badge-red",
    color: "#dc2626",
    minScore: 0,
  },
};

export const SEVERITY_LEVELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

export const SEVERITY_META = {
  LOW: { label: "Low", badgeClass: "badge-blue" },
  MEDIUM: { label: "Medium", badgeClass: "badge-amber" },
  HIGH: { label: "High", badgeClass: "badge-red" },
};

export const PROJECT_SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "name", label: "Project Name" },
  { value: "location", label: "Location" },
  { value: "status", label: "Status" },
  { value: "deadline", label: "Deadline" },
  { value: "startDate", label: "Start Date" },
  { value: "totalBudget", label: "Total Budget" },
  { value: "completedPercentage", label: "Progress %" },
];

export const DEFAULT_PAGE_SIZE = 8;

