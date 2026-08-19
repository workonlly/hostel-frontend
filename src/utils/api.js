const isRenderHost = typeof window !== "undefined" && window.location.hostname.includes("onrender.com");
const DEFAULT_URL = isRenderHost ? "https://hostel-backend-cveq.onrender.com" : "http://localhost:4000";
const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_URL).replace(/\/$/, "");

export async function apiFetch(
  endpoint,
  options = {}
) {
  // Role is non-sensitive display data stored in localStorage for routing.
  // Tokens are in HttpOnly cookies and are sent automatically by the browser
  // via credentials: "include" — we never read or forward them from JavaScript.
  let role = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      role = user.role || "";
    }
  } catch (e) {
    // Ignore parse errors
  }

  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,
      credentials: "include", // sends HttpOnly cookies automatically
      headers: {
        "Content-Type": "application/json",
        role: role || "",
        ...(options.headers || {}),
      },
    }
  );

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    throw new Error(
      "Invalid server response"
    );
  }

  /* ================= AUTO LOGOUT on expired session ================= */
  const isAuthEndpoint =
    endpoint.startsWith("/api/auth/") ||
    endpoint.includes("/login") ||
    endpoint.includes("/send-otp") ||
    endpoint.includes("/verify");

  if (!response.ok) {
    const errorMsg = (data.message || data.error || "").toLowerCase();

    const isSessionExpired = 
      response.status === 401 && (
        errorMsg.includes("log in again") ||
        errorMsg.includes("session has expired") ||
        errorMsg.includes("token is required") ||
        errorMsg.includes("invalid or expired token") ||
        errorMsg.includes("unauthorized")
      );

    if (!isAuthEndpoint && isSessionExpired) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Your session has expired. Redirecting to login...");
    }

    const err = new Error(
      data.message ||
      data.error ||
      "Request failed"
    );
    err.data = data;
    throw err;
  }

  return data;
}