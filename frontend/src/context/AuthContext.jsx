import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Token exists, sync user from storage
    setUser(authService.getUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user && authService.getToken()),
      isAdmin: user?.role === "ADMIN",
      isEngineer: user?.role === "SITE_ENGINEER" || user?.role === "ENGINEER",
    }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
