import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Icon from "../components/common/Icon";
import "../styles/auth.css";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isExpired = searchParams.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid email or password. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      {/* Brand Panel */}
      <section className="auth-brand-panel">
        <div className="brand-header">
          <div className="brand-logo-mark">SR</div>
          <div>
            <div className="brand-name">SmartRoad</div>
            <div className="brand-department">Rural Road Construction Monitoring</div>
          </div>
        </div>

        <div className="brand-center">
          <span className="brand-eyebrow">National Rural Infrastructure Platform</span>
          <h1 className="brand-heading">
            Better Roads.<br />
            Smarter Decisions.
          </h1>
          <p className="brand-tagline">
            "Monitor Progress. Analyze Performance. Make Better Decisions."
          </p>
        </div>

        <div className="brand-footer">
          <div className="system-status-indicator">
            <span className="system-status-dot" />
            <span>Secure System Active</span>
          </div>
          <span>·</span>
          <span>Decision Support Java Engine</span>
        </div>
      </section>

      {/* Login Form Panel */}
      <section className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Sign in to SmartRoad</h2>
            <p className="auth-card-subtitle">
              Enter your authorized department credentials.
            </p>
          </div>

          {isExpired && !error && (
            <div className="auth-alert auth-alert-info" role="alert">
              <Icon name="alert" size={16} />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@smartroad.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Authenticating..." : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="auth-form-footer">
            Role-based portal: Admin & Site Engineers only.
          </div>
        </div>
      </section>
    </main>
  );
}
