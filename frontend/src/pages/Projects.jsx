import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDebounce from "../hooks/useDebounce";
import projectService from "../services/projectService";
import userService from "../services/userService";
import { getErrorMessage } from "../services/api";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import ProjectTable from "../components/projects/ProjectTable";
import FiltersBar from "../components/projects/FiltersBar";
import Pagination from "../components/common/Pagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { SkeletonTable } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import Icon from "../components/common/Icon";

export default function Projects() {
  const { isAdmin } = useAuth();

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(0);

  // Data state
  const [projectsData, setProjectsData] = useState({
    content: [],
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Feedback
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    projectId: null,
    projectName: "",
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

  // Load engineers for admin filter dropdown
  useEffect(() => {
    if (isAdmin) {
      userService
        .getEngineers()
        .then((data) => setEngineers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isAdmin]);

  // Fetch projects from search endpoint
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await projectService.searchProjects({
        q: debouncedSearch || undefined,
        status: status || undefined,
        location: location || undefined,
        engineerId: engineerId ? Number(engineerId) : undefined,
        page,
        size: DEFAULT_PAGE_SIZE,
        sort,
        direction,
      });

      setProjectsData({
        content: res?.content || [],
        page: res?.page ?? page,
        size: res?.size ?? DEFAULT_PAGE_SIZE,
        totalElements: res?.totalElements ?? 0,
        totalPages: res?.totalPages ?? 0,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, location, engineerId, page, sort, direction]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset page to 0 when filters change
  const handleSearchChange = (val) => {
    setSearchInput(val);
    setPage(0);
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(0);
  };

  const handleEngineerChange = (val) => {
    setEngineerId(val);
    setPage(0);
  };

  const handleSortChange = (col) => {
    setSort(col);
    setPage(0);
  };

  const handleDirectionToggle = () => {
    setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStatus("");
    setLocation("");
    setEngineerId("");
    setSort("createdAt");
    setDirection("desc");
    setPage(0);
  };

  // Delete project handler (Admin only)
  const openDeleteDialog = (id, name) => {
    setDeleteDialog({
      isOpen: true,
      projectId: id,
      projectName: name,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await projectService.deleteProject(deleteDialog.projectId);
      addToast(`Project "${deleteDialog.projectName}" successfully deleted.`, "success");
      setDeleteDialog({ isOpen: false, projectId: null, projectName: "", loading: false });
      fetchProjects();
    } catch (err) {
      addToast(getErrorMessage(err), "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? "Road Construction Projects" : "My Supervised Projects"}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Comprehensive repository of rural road projects, contract allocations, and field progress"
              : "Rural road construction projects assigned to your supervision"}
          </p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <Link to="/projects/new" className="btn btn-primary">
              <Icon name="plus" size={16} /> New Project
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar with Search, Status, Engineer (if Admin), Sort */}
      <FiltersBar
        search={searchInput}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        location={location}
        onLocationChange={(val) => {
          setLocation(val);
          setPage(0);
        }}
        engineerId={engineerId}
        onEngineerChange={handleEngineerChange}
        engineers={engineers}
        sort={sort}
        direction={direction}
        onSortChange={handleSortChange}
        onDirectionToggle={handleDirectionToggle}
        onClear={handleClearFilters}
        isAdmin={isAdmin}
      />

      {/* Content Area */}
      {loading ? (
        <SkeletonTable rows={6} cols={isAdmin ? 8 : 7} />
      ) : error ? (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: "20px" }}>
            <Icon name="alert" size={20} />
            <div>
              <strong>Failed to load projects</strong>
              <p style={{ margin: "4px 0 0" }}>{error}</p>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={fetchProjects}>
            <Icon name="refresh" size={16} /> Retry
          </button>
        </div>
      ) : projectsData.content.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No Projects Match Filter Criteria"
            description="Try modifying search keywords, resetting status filters, or clearing all filters."
            icon="projects"
            actionText="Clear Filters"
            onAction={handleClearFilters}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <ProjectTable
            projects={projectsData.content}
            isAdmin={isAdmin}
            onDelete={openDeleteDialog}
            onSort={(col) => {
              if (sort === col) {
                handleDirectionToggle();
              } else {
                setSort(col);
                setDirection("asc");
                setPage(0);
              }
            }}
            sort={sort}
            direction={direction}
          />
          <Pagination
            page={projectsData.page}
            totalPages={projectsData.totalPages}
            totalElements={projectsData.totalElements}
            size={projectsData.size}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Road Project"
        message={`Are you sure you want to permanently delete "${deleteDialog.projectName}"? All recorded milestones, progress updates, expenses, and photos will be erased.`}
        confirmText="Delete Project"
        cancelText="Keep Project"
        isDanger={true}
        loading={deleteDialog.loading}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, projectId: null, projectName: "", loading: false })
        }
      />
    </div>
  );
}
