import { Link } from "react-router-dom";
import Icon from "../components/common/Icon";

export default function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center", padding: 40 }}>
      <Icon name="alert" size={48} color="var(--text-muted)" />
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "16px 0 8px", color: "var(--text-primary)" }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 24 }}>
        The requested URL was not found on this SmartRoad workstation. Please verify the URL or return to the main dashboard.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        ← Return to Dashboard
      </Link>
    </div>
  );
}
