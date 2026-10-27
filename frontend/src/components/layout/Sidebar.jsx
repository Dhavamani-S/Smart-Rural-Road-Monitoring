import { Link, NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Icon from "../common/Icon";

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { isAdmin } = useAuth();

  const adminNav = [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard", end: true },
    { label: "Projects", path: "/projects", icon: "projects", end: true },
    { label: "New Project", path: "/projects/new", icon: "plus" },
    { label: "Expenses", path: "/expenses", icon: "expenses" },
    { label: "Reports", path: "/reports", icon: "reports" },
    { label: "Users", path: "/users", icon: "users" },
    { label: "My Profile", path: "/profile", icon: "profile" },
  ];

  const engineerNav = [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard", end: true },
    { label: "My Projects", path: "/projects", icon: "projects", end: true },
    { label: "Expenses", path: "/expenses", icon: "expenses" },
    { label: "Reports", path: "/reports", icon: "reports" },
    { label: "My Profile", path: "/profile", icon: "profile" },
  ];

  const navItems = isAdmin ? adminNav : engineerNav;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "mobile-open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="sidebar-logo-icon">SR</div>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">SmartRoad</span>
              <span className="sidebar-tagline">Rural Infra Monitor</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">
            {isAdmin ? "Administrative Controls" : "Field Operations"}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <span className="sidebar-nav-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)",
              }}
            />
            <span style={{ color: "#ffffff", fontWeight: 600 }}>SmartRoad System</span>
          </div>
          <span>Decision Support Platform</span>
        </div>
      </aside>
    </>
  );
}
