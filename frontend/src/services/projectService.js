import api from "./api";

const projectService = {
  // Project CRUD
  async getProjects() {
    const response = await api.get("/api/projects");
    return response.data;
  },

  async getProjectById(id) {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post("/api/projects", projectData);
    return response.data;
  },

  async updateProject(id, projectData) {
    const response = await api.put(`/api/projects/${id}`, projectData);
    return response.data;
  },

  async deleteProject(id) {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },

  // Search & Filter
  async searchProjects(params = {}) {
    // Filter out null, undefined or empty string values
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });

    const response = await api.get("/api/projects/search", { params: cleanParams });
    return response.data;
  },

  // Project Report
  async getProjectReport(id) {
    const response = await api.get(`/api/projects/${id}/report`);
    return response.data;
  },

  // Assignment & Status workflow
  async assignEngineer(id, engineerId) {
    const response = await api.put(`/api/projects/${id}/assignment`, {
      engineerId: engineerId || null,
    });
    return response.data;
  },

  async updateProjectStatus(id, status) {
    const response = await api.patch(`/api/projects/${id}/status`, { status });
    return response.data;
  },

  // Progress Updates
  async getProgressHistory(projectId) {
    const response = await api.get(`/api/projects/${projectId}/progress`);
    return response.data;
  },

  async addProgress(projectId, data) {
    const response = await api.post(`/api/projects/${projectId}/progress`, data);
    return response.data;
  },

  // Milestones
  async getMilestones(projectId) {
    const response = await api.get(`/api/projects/${projectId}/milestones`);
    return response.data;
  },

  async createMilestone(projectId, data) {
    const response = await api.post(`/api/projects/${projectId}/milestones`, data);
    return response.data;
  },

  async completeMilestone(projectId, milestoneId) {
    const response = await api.patch(
      `/api/projects/${projectId}/milestones/${milestoneId}/complete`
    );
    return response.data;
  },

  async deleteMilestone(projectId, milestoneId) {
    const response = await api.delete(
      `/api/projects/${projectId}/milestones/${milestoneId}`
    );
    return response.data;
  },

  // Expenses
  async getExpenses(projectId) {
    const response = await api.get(`/api/projects/${projectId}/expenses`);
    return response.data;
  },

  async addExpense(projectId, data) {
    const response = await api.post(`/api/projects/${projectId}/expenses`, data);
    return response.data;
  },

  // Photos
  async getPhotos(projectId) {
    const response = await api.get(`/api/projects/${projectId}/photos`);
    return response.data;
  },

  async uploadPhoto(projectId, file, caption) {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (caption) {
      formData.append("caption", caption);
    }
    const response = await api.post(`/api/projects/${projectId}/photos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async deletePhoto(projectId, photoId) {
    const response = await api.delete(`/api/projects/${projectId}/photos/${photoId}`);
    return response.data;
  },
};

export default projectService;
