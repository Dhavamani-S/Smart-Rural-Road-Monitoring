import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import useAuth from "./hooks/useAuth";

import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import EditProject from "./pages/EditProject";
import ProjectDetails from "./pages/ProjectDetails";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Loader from "./components/common/Loader";

// Route guard for authenticated users
function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader message="Authenticating SmartRoad session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Route guard for Admin-only routes
function AdminRoute({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader message="Checking administration clearance..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Engineers accessing admin-only routes get redirected to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard (Admin or Engineer) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Projects List */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <Projects />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* New Project (Admin only) */}
      <Route
        path="/projects/new"
        element={
          <AdminRoute>
            <Layout>
              <CreateProject />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Edit Project (Admin only) */}
      <Route
        path="/projects/:id/edit"
        element={
          <AdminRoute>
            <Layout>
              <EditProject />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Project Details with tabs: Overview, Analysis, Progress, Milestones, Expenses, Photos */}
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Project Expenses */}
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Portfolio Summary Report */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Detailed Project Report */}
      <Route
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* User Management (Admin only) */}
      <Route
        path="/users"
        element={
          <AdminRoute>
            <Layout>
              <Users />
            </Layout>
          </AdminRoute>
        }
      />

      {/* User Profile & Password Change */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Legacy route fallback */}
      <Route path="/road-health" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
