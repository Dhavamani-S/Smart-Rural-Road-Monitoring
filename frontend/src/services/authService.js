import api from "./api";

const TOKEN_KEY = "smartroad_token";
const USER_KEY = "smartroad_user";

const authService = {
  async login(email, password) {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });

    const user = {
      email: response.data.email,
      fullName: response.data.fullName,
      role: response.data.role,
    };

    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser() {
    try {
      const item = localStorage.getItem(USER_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },
};

export default authService;
