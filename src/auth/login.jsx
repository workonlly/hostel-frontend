import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  apiFetch,
} from "../utils/api";
import { broadcastSessionLogin } from "../utils/sessionSync";

function Login() {
  const navigate = useNavigate();

  // Redirect already-logged-in users away from the login page
  useEffect(() => {
    const role = localStorage.getItem("role")?.toLowerCase();
    const user = localStorage.getItem("user");
    if (role === "student" && user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [sessionConflict, setSessionConflict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otpRole, setOtpRole] = useState("");
  const [otp, setOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (!otpPending || otpCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setOtpCountdown((count) => count - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpPending, otpCountdown]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    if (e.target.name === "email" || e.target.name === "password") {
      setOtpPending(false);
      setOtp("");
      setOtpCountdown(0);
      setSessionConflict(null);
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const persistAuth = (data) => {
    // Only store non-sensitive display data — tokens live in HttpOnly cookies set by the server
    localStorage.setItem("role", "student");
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...data.user,
        role: "student",
      })
    );

    // Broadcast login to all open tabs so they sync immediately
    broadcastSessionLogin({
      role: "student",
      user: data.user,
      sessionId: data.sessionId,
    });

    navigate("/");
  };

  const submitLoginRequest = async (forceLogout = false) => {
    const headers = {
      "Content-Type": "application/json",
    };

    setSessionConflict(null);
    setError("");

    try {
      const data =
        (await apiFetch("/api/auth/login", {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: "student",
            forceLogout,
          }),
        })) || {};

      if (data?.success && data?.message === "OTP generated") {
        setOtpPending(true);
        setOtpRole("student");
        setOtp("");
        setOtpCountdown(60);
        setError("");
        return { requiresOtp: true };
      }

      if (data?.user) {
        persistAuth(data);
        return { success: true };
      }

      throw new Error(data?.message || "Login failed");
    } catch (err) {
      if (err.data?.conflict || err.status === 409) {
        setSessionConflict({
          currentRole: err.data?.currentRole || "another role",
          message: err.data?.message || err.message,
        });
      } else {
        throw err;
      }
    }
  };

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await submitLoginRequest(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e, forceLogout = false) => {
    if (e) e.preventDefault();

    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSessionConflict(null);

      const data =
        (await apiFetch("/api/auth/verify-login-otp", {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            otp,
            role: "student",
            forceLogout,
          }),
        })) || {};

      if (!data?.user) {
        throw new Error(data?.message || "OTP verification failed");
      }

      persistAuth(data);
    } catch (err) {
      console.error(err);
      if (err.data?.conflict || err.status === 409) {
        setSessionConflict({
          currentRole: err.data?.currentRole || "another role",
          message: err.data?.message || err.message,
        });
      } else {
        setError(err.message || "OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await submitLoginRequest(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleForceSwitchAccount = async () => {
    if (otpPending) {
      await handleVerifyOtp(null, true);
    } else {
      try {
        setLoading(true);
        await submitLoginRequest(true);
      } catch (err) {
        setError(err.message || "Failed to switch accounts");
      } finally {
        setLoading(false);
      }
    }
  };

  return (

    <div className="min-h-screen flex bg-[#f5f5f5]">

      {/* ================= LEFT ================= */}

      <div className="hidden md:flex w-1/2 bg-[#5b0e0e] text-white items-center justify-center p-16">

        <div>

          <div className="flex items-center gap-3 justify-center mb-5">

            <img
              src="/l.png"
              alt="nithlogo"
              width={80}
              height={80}
              className="object-contain"
            />

            <h1 className="text-5xl font-bold">

              Hostel Management

            </h1>

          </div>

          <p className="text-lg text-gray-200 leading-8">

            Smart hostel administration system for
            outpass management, complaints and
            student monitoring.

          </p>

        </div>

      </div>

      {/* ================= RIGHT ================= */}

      <div className="flex w-full md:w-1/2 items-center justify-center px-6">

        <form
          onSubmit={handleLogin}
          className="bg-white w-full max-w-md rounded-xl shadow-sm border border-gray-200 p-10"
        >

          <h2 className="text-3xl font-semibold text-[#5b0e0e] mb-8 text-center">

            Login

          </h2>

          {/* SESSION CONFLICT BANNER */}
          {sessionConflict && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-5 text-amber-900 text-sm">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Active Session Detected
              </div>
              <p className="mb-3 text-xs leading-relaxed text-amber-800">
                {sessionConflict.message || `An active session for '${sessionConflict.currentRole}' is currently running in this browser.`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleForceSwitchAccount}
                  disabled={loading}
                  className="flex-1 bg-[#5b0e0e] text-white text-xs font-semibold py-2 px-3 rounded hover:bg-[#741616] transition disabled:opacity-50"
                >
                  Log out previous session & Proceed
                </button>
                <button
                  type="button"
                  onClick={() => setSessionConflict(null)}
                  className="border border-gray-300 text-gray-700 text-xs font-semibold py-2 px-3 rounded hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}

          {/* EMAIL */}

          <input
            type="email"
            name="email"
            placeholder="College Mail"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md mb-4 outline-none focus:border-[#5b0e0e]"
          />

          {/* PASSWORD */}

          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md mb-5 outline-none focus:border-[#5b0e0e]"
          />

          {/* ROLE */}

          {/* <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md mb-6 outline-none focus:border-[#5b0e0e]"
          >

            <option value="student">

              Student

            </option>

            <option value="attendant">

              Attendant

            </option>

            <option value="guard">

              Security Guard

            </option>
            <option value="warden">

              warden

            </option>

          </select> */}

          {otpPending && (
            <div className="mb-5">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                className="w-full border border-gray-300 p-3 rounded-md mb-3 outline-none focus:border-[#5b0e0e]"
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || !otp}
                  className="flex-1 bg-[#5b0e0e] hover:bg-[#741616] transition text-white py-3 rounded-md disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || otpCountdown > 0}
                  className="flex-1 border border-[#5b0e0e] text-[#5b0e0e] hover:bg-[#f7eaea] transition py-3 rounded-md disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : otpCountdown > 0
                      ? `Resend OTP (${otpCountdown}s)`
                      : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* BUTTON */}

          {!otpPending && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5b0e0e] hover:bg-[#741616] transition text-white py-3 rounded-md disabled:opacity-50"
            >

              {loading
                ? "Logging in..."
                : "Login"}

            </button>
          )}

          {/* SIGNUP */}

          <p className="text-center text-gray-600 mt-6">

            Don&apos;t have an account?{" "}

            <Link
              to="/signup"
              className="text-[#5b0e0e] font-medium hover:underline"
            >

              Signup

            </Link>

          </p>

        </form>

      </div>

    </div>
  );
}

export default Login;
