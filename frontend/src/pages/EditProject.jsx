import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import projectService from "../services/projectService";
import { getErrorMessage } from "../services/api";
import ProjectForm from "../components/projects/ProjectForm";
import Loader from "../components/common/Loader";
import Icon from "../components/common/Icon";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    projectService
      .getProjectById(id)
      .then((data) => setProject(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (payload) => {
    await projectService.updateProject(id, payload);
    navigate(`/projects/${id}?updated=1`);
  };

  if (loading) {
    return <Loader message="Loading project details for editing..." />;
  }

  if (error || !project) {
    return (
      <div className="card">
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="alert" size={18} />
          <div>
            <strong>Unable to edit project</strong>
            <p>{error || "Project not found"}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/projects")}
        >
          Return to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Project: {project.name}</h1>
          <p className="page-subtitle">
            Update contract scope, budget allocations, timeline deadlines, and site engineer assignments
          </p>
        </div>
      </div>

      <ProjectForm
        initialData={project}
        isEdit={true}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
