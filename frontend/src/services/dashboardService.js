import api from "./api";

const dashboardService = {
  async getDashboard() {
    const response = await api.get("/api/dashboard");
    return response.data;
  },
};

export default dashboardService;
