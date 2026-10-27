import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Icon from "../common/Icon";

export default function Navbar({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getPageTitle = (pathname) => {
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
    if (pathname === "/projects/new") return "New Project";
    if (pathname.includes("/edit")) return "Edit Project";
    if (pathname.startsWith("/projects/")) return "Project Details";
    if (pathname === "/projects") return "Road Projects";
    if (pathname === "/expenses") return "Project Expenses";
    if (pathname.startsWith("/reports/")) return "Project Report";
    if (pathname === "/reports") return "Portfolio Reports";
    if (pathname === "/users") return "User Management";
    if (pathname === "/profile") return "My Profile";
    return "SmartRoad";
  };

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "SITE_ENGINEER"
      ? "Site Engineer"
      : user?.role || "User";

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="menu-toggle-btn"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Icon name="menu" size={20} />
        </button>

        <h1 className="navbar-page-title">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="navbar-right">
        <Link to="/profile" className="user-profile-badge" title="View Profile">
          <div className="user-avatar-circle">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user?.fullName || user?.email}</span>
            <span className="user-role-tag">{roleLabel}</span>
          </div>
        </Link>

        <button
          type="button"
          className="signout-btn"
          onClick={handleSignout}
          title="Sign out of SmartRoad"
        >
          <Icon name="logout" size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
