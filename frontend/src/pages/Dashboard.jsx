import useAuth from "../hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import EngineerDashboard from "./EngineerDashboard";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  if (isAdmin || user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <EngineerDashboard />;
}
