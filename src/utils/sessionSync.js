/**
 * Cross-Tab Session Synchronization Utility
 * Keeps authentication states synchronized across all browser tabs and prevents role collisions.
 */

const CHANNEL_NAME = "hostel_auth_session_channel";

let broadcastChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel not available:", e);
  }
}

/**
 * Broadcasts a login event to other tabs
 */
export function broadcastSessionLogin(payload) {
  const message = {
    type: "AUTH_LOGIN",
    timestamp: Date.now(),
    role: payload?.role || "student",
    user: payload?.user,
    sessionId: payload?.sessionId
  };

  try {
    broadcastChannel?.postMessage(message);
  } catch (e) {
    // Ignore postMessage failure
  }

  // Also trigger storage event for fallback
  try {
    localStorage.setItem("session_sync_event", JSON.stringify(message));
  } catch (e) {}
}

/**
 * Broadcasts a logout event to all other tabs
 */
export function broadcastSessionLogout() {
  const message = {
    type: "AUTH_LOGOUT",
    timestamp: Date.now()
  };

  try {
    broadcastChannel?.postMessage(message);
  } catch (e) {}

  try {
    localStorage.setItem("session_sync_event", JSON.stringify(message));
  } catch (e) {}
}

/**
 * Initializes cross-tab listeners in App.tsx
 */
export function initSessionSync({ onLogout, onRoleConflict, onLogin }) {
  if (typeof window === "undefined") return () => {};

  const handleMessage = (data) => {
    if (!data || !data.type) return;

    if (data.type === "AUTH_LOGOUT") {
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          window.location.href = "/login";
        }
      }
    } else if (data.type === "AUTH_LOGIN") {
      const currentRole = localStorage.getItem("role")?.toLowerCase();
      // If another tab logged in as a non-student (e.g. admin/warden/attendant), handle conflict
      if (data.role && data.role !== "student") {
        if (onRoleConflict) {
          onRoleConflict(data.role);
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      } else if (data.role === "student" && currentRole !== "student") {
        if (onLogin) {
          onLogin(data);
        }
      }
    }
  };

  // 1. BroadcastChannel Listener
  const bcListener = (event) => {
    handleMessage(event.data);
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", bcListener);
  }

  // 2. Storage event listener (fallback & cross-origin port sync)
  const storageListener = (event) => {
    if (event.key === "session_sync_event" && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        handleMessage(parsed);
      } catch (e) {}
    } else if (event.key === "role" && event.newValue && event.newValue !== "student") {
      // Role changed in local storage to non-student
      handleMessage({ type: "AUTH_LOGIN", role: event.newValue });
    }
  };

  window.addEventListener("storage", storageListener);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", bcListener);
    }
    window.removeEventListener("storage", storageListener);
  };
}
