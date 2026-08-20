import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./auth/login";
import Signup from "./auth/signup";
import OutpassLayout from "./students/outpasses";
import OutpassForm from "./students/outpass_form.jsx";
import Dashboard from "./students/Dashboard";
import { apiFetch } from "./utils/api";

import { initSessionSync } from "./utils/sessionSync";

function useAuth() {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    let isMounted = true;

    // Validate session with the backend via HttpOnly cookie
    apiFetch("/api/auth/me", { method: "GET" })
      .then((data: any) => {
        if (!isMounted) return;
        if (data?.success && data?.user) {
          // Refresh the stored user data
          localStorage.setItem("user", JSON.stringify({ ...data.user, role: "student" }));
          localStorage.setItem("role", "student");
          setAuthState("authenticated");
        } else {
          // Session invalid — clear stale data
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // Network error or 401 — check if local data exists as temporary fallback or mark unauthenticated
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        setAuthState("unauthenticated");
      });

    // Listen for cross-tab session events (login / logout / role conflict)
    const cleanupSync = initSessionSync({
      onLogout: () => {
        if (isMounted) {
          setAuthState("unauthenticated");
        }
      },
      onLogin: (data: any) => {
        if (isMounted && data?.role === "student") {
          localStorage.setItem("user", JSON.stringify({ ...data.user, role: "student" }));
          localStorage.setItem("role", "student");
          setAuthState("authenticated");
        }
      },
      onRoleConflict: () => {
        if (isMounted) {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setAuthState("unauthenticated");
        }
      }
    });

    return () => {
      isMounted = false;
      cleanupSync();
    };
  }, []);

  return authState;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userStr = localStorage.getItem("user");
  const role = localStorage.getItem("role")?.toLowerCase();

  if (!userStr || role !== "student") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const userStr = localStorage.getItem("user");
  const role = localStorage.getItem("role")?.toLowerCase();

  if (userStr && role === "student") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const authState = useAuth();

  // Show nothing while we check the session — avoids flash of login page
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/otp" element={<Navigate to="/login" replace />} />

        {/* Student Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/student" element={<Navigate to="/" replace />} />

        <Route path="/outpasses" element={
          <ProtectedRoute>
            <OutpassLayout />
          </ProtectedRoute>
        } />

        <Route path="/add-outpass" element={
          <ProtectedRoute>
            <OutpassForm />
          </ProtectedRoute>
        } />

        {/* Legacy redirects */}
        <Route path="/outpass" element={<Navigate to="/outpasses" replace />} />
        <Route path="/apply-outpass" element={<Navigate to="/add-outpass" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
