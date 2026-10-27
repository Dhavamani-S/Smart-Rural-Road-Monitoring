import api from "./api";

const userService = {
  // Current logged in user profile
  async getProfile() {
    const response = await api.get("/api/profile");
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post("/api/profile/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Admin user management
  async getUsers() {
    const response = await api.get("/api/users");
    return response.data;
  },

  async setUserActive(id, active) {
    const response = await api.patch(`/api/users/${id}/active`, { active });
    return response.data;
  },

  async getEngineers() {
    const response = await api.get("/api/users/engineers");
    return response.data;
  },

  async createEngineer(engineerData) {
    const response = await api.post("/api/users/engineers", engineerData);
    return response.data;
  },
};

export default userService;

