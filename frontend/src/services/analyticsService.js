import api from "./api";

const analyticsService = {
  async getProjectHealth(projectId) {
    const response = await api.get(`/api/projects/${projectId}/health`);
    return response.data;
  },

  async getProjectBudgetAnalysis(projectId) {
    const response = await api.get(`/api/projects/${projectId}/budget-analysis`);
    return response.data;
  },

  async getProjectEvaluation(projectId) {
    const response = await api.get(`/api/projects/${projectId}/evaluation`);
    return response.data;
  },

  async getProjectAlerts(projectId) {
    const response = await api.get(`/api/projects/${projectId}/alerts`);
    return response.data;
  },

  async getProjectRecommendations(projectId) {
    const response = await api.get(`/api/projects/${projectId}/recommendations`);
    return response.data;
  },

  async getHealthSummary() {
    const response = await api.get("/api/analytics/health-summary");
    return response.data;
  },

  async getAllAlerts() {
    const response = await api.get("/api/analytics/alerts");
    return response.data;
  },

  async getAllRecommendations(issuesOnly = false) {
    const response = await api.get("/api/analytics/recommendations", {
      params: { issuesOnly },
    });
    return response.data;
  },
};

export default analyticsService;
