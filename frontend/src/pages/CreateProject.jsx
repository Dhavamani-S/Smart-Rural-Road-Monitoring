import { useNavigate } from "react-router-dom";
import projectService from "../services/projectService";
import ProjectForm from "../components/projects/ProjectForm";

export default function CreateProject() {
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    const created = await projectService.createProject(payload);
    navigate(`/projects/${created.id}?created=1`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Road Construction Project</h1>
          <p className="page-subtitle">
            Define project scope, budget allocation, schedule targets, and site engineer supervision
          </p>
        </div>
      </div>

      <ProjectForm isEdit={false} onSubmit={handleCreate} />
    </div>
  );
}
