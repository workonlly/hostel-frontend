import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./auth/login";
import Signup from "./auth/signup";
import OutpassLayout from "./students/outpasses";
import OutpassForm from "./students/outpass_form.jsx";
import Dashboard from "./students/Dashboard";
import { apiFetch } from "./utils/api";

/**
 * On app startup, call /api/auth/me to silently validate the session
 * using the HttpOnly cookie. This means:
 *  - Tokens are NEVER stored in localStorage (secure by design)
 *  - Sessions survive browser close/reopen automatically
 *  - The cookie is rotated silently if the access token expired
 */
function useAuth() {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const existingRole = localStorage.getItem("role")?.toLowerCase();
    const existingUser = localStorage.getItem("user");

    // Quick sync check: if no local data at all, skip the network call
    if (!existingRole || !existingUser) {
      setAuthState("unauthenticated");
      return;
    }

    // Validate session with the backend via HttpOnly cookie
    apiFetch("/api/auth/me", { method: "GET" })
      .then((data: any) => {
        if (data?.success && data?.user) {
          // Refresh the stored user data (may have changed)
          localStorage.setItem("user", JSON.stringify({ ...data.user, role: "student" }));
          localStorage.setItem("role", "student");
          // Remove any tokens that may have been stored in the past
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("sessionId");
          setAuthState("authenticated");
        } else {
          // Session invalid — clear stale data
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("sessionId");
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        // Network error or 401 — treat as unauthenticated
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("sessionId");
        setAuthState("unauthenticated");
      });
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
