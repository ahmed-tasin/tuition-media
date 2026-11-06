
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AvailableTuition from "./pages/tutor/AvailableTuition";


import "./style.css";

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "tutor") {
    return <Navigate to="/tutor" replace />;
  }

  return <Navigate to="/guardian" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "tutor", "guardian"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />



      <Route
        path="/tutor"
        element={
          <ProtectedRoute roles={["tutor"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
  path="/tutor/available-tuitions"
  element={
    <ProtectedRoute roles={["tutor"]}>
      <AvailableTuition />
    </ProtectedRoute>
  }
/>

      <Route
        path="/guardian"
        element={
          <ProtectedRoute roles={["guardian"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
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
