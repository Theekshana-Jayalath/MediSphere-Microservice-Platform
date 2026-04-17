import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth/Login.css";

const roles = [
  { key: "patient", label: "Patient", icon: "person" },
  { key: "doctor", label: "Doctor", icon: "medical_services" },
  { key: "admin", label: "Admin", icon: "admin_panel_settings" },
];

const AUTH_ENDPOINTS = [
  import.meta.env.VITE_AUTH_API_URL,
  "http://localhost:5006/api/auth",
  "http://localhost:5015/api/auth",
].filter(Boolean);

const DOCTOR_ENDPOINTS = [
  import.meta.env.VITE_DOCTOR_API_BASE_URL,
  "http://localhost:6010/api/doctors",
].filter(Boolean);

export default function Login() {
  const [selectedRole, setSelectedRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please enter email and password");
      return;
    }

    try {
      let response = null;
      let data = null;
      let lastError = null;

      const isDoctorLogin = selectedRole === "doctor";
      const endpoints = isDoctorLogin ? DOCTOR_ENDPOINTS : AUTH_ENDPOINTS;

      for (const baseUrl of endpoints) {
        try {
          response = await fetch(`${baseUrl}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          });

          data = await response.json();

          // Stop trying fallbacks when the auth service is reachable.
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!response) {
        console.error("Login network error:", lastError);
        alert("Auth service is not reachable. Please start auth-service and try again.");
        return;
      }

      if (!response.ok) {
        alert(data?.message || "Login failed");
        return;
      }

      const role = String(data?.user?.role || "").toUpperCase();
      const expectedRole = selectedRole.toUpperCase();

      if (role !== expectedRole) {
        alert(`This account is registered as ${role || "UNKNOWN"}, not ${expectedRole}.`);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // persist patientId for booking/payment flows
      if (String(data.user?.role || "").toUpperCase() === "PATIENT") {
        const pid = data.user?.id || data.user?._id || data.user?.patientId;
        if (pid) localStorage.setItem("patientId", String(pid));
      }

      if (role === "PATIENT") {
        navigate("/patient/dashboard");
      } else if (role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong during login");
    }
  };

  return (
    <div className="login-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <div className="login-bg-glow login-glow-top"></div>
      <div className="login-bg-glow login-glow-bottom"></div>

      <main className="login-main">
        <div className="login-card">
          <div className="login-brand-side">
            <div className="login-brand-content">
              <div className="login-brand-title">MEDISPHERE</div>
              <h1 className="login-brand-heading">
                Personalized health intelligence at your fingertips.
              </h1>
              <p className="login-brand-text">
                Experience the next evolution of concierge medicine. Secure,
                seamless, and powered by advanced clinical AI.
              </p>
            </div>

            <div className="login-brand-bottom">
              <div className="login-avatar-group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9zVjw-0KBwPc-PAPVA26ImU_4oB3T9Nwntc5TvQSBL2lwp4JCCzg-tfWP-vX7T0OvWAe06SuWVHRiFQ5w-vXCuNfzwwDZ4N4hxeBbHA0Nw0-n3MAPBzLb-En8rIaKEH6eIbFnfZub3DmSz0lgQI88xZj56QxWzhyjxROX_PYx9024Odd3oiN5sq95t8ZctztYdphxC58cbIDS5PUcdHXXZj3s9a0nSlP1J2dDWTyIu_6pC2NUDR90IkNgLxw5R_hqdmOXfkCN0gw"
                  alt="doctor"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAM91RdVVZjnrGvJS8pAIm9geGIyX6saCmjfLM38b0sLi4_ggB8v6QckFbYGw08l2g2keMKxsha99fV1g6RQ9xAj3ZFTgVXZUqpTxRpJFYH_zxLUPq76xE3-F_q6rFSA6vmEQ0Y3ooklC69GnYERKfq_eycaR-X-vRdqa3lJbPcYuTWOQwybWvxIMC3FqgK8SvJx7kRr54L2Y6YU4JV8eZq6zx7NBwH26d7sQ23lj7Qw-75AXBbm3uZVTJhjl0fXctY3qqJeSZ3YuA"
                  alt="doctor"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAKArWatVu_4icdMwImk-h2cK1wIUFa5pbLD9-5TTyJutt0TWCvTVAhVXZZPxeTfPm2Cm5q1TsQGsuJokOfGeA8C_56Dq0u8ow4r9W6aQDC4pL7AJKAJ-uPFntpwjr66viG8HyR3FsDW2vOrbMLmGMnv7rexh3PE9MqXDScy8tLSCAc8i1gcy8TTOfFYSUOga8B-XRJLXVOTTlt2HG4tYPz-D2asT1SRR8z9eEY1P_itgIIZtoEC9Teq3e2zG8zTP12yRRV52ogM4"
                  alt="doctor"
                />
              </div>
              <span>Trusted by 500+ Specialists</span>
            </div>

            <div className="login-brand-icon">
              <span className="material-symbols-outlined">
                clinical_notes
              </span>
            </div>
          </div>

          <div className="login-form-side">
            <div className="login-form-head">
              <h2>Welcome Back</h2>
              <p>Please select your role and enter your credentials.</p>
            </div>

            <div className="login-role-grid">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  className={`login-role-btn ${
                    selectedRole === role.key ? "active" : ""
                  }`}
                  onClick={() => setSelectedRole(role.key)}
                >
                  <span className="material-symbols-outlined">{role.icon}</span>
                  <span>{role.label}</span>
                </button>
              ))}
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="login-field">
                <div className="login-field-row">
                  <label htmlFor="password">Password</label>
                  <a href="#">Forgot password?</a>
                </div>

                <div className="login-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="login-remember">
                <input id="remember" type="checkbox" />
                <label htmlFor="remember">Remember this device</label>
              </div>

              <button type="submit" className="login-submit-btn">
                Sign In
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="login-register-text">
              Don&apos;t have an account?
              <button type="button" onClick={() => navigate("/register")}>
                Register Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <p>© 2024 MEDISPHERE. All health data is encrypted.</p>

        <div className="login-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
    </div>
  );
}