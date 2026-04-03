import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth/PatientRegister.css";

export default function PatientRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    bloodGroup: "",
    allergies: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    username: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      alert("Full name, email and password are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!formData.terms) {
      alert("Please accept the terms and privacy policy");
      return;
    }

    try {
      setLoading(true);

      const authResponse = await fetch("http://localhost:5006/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: "PATIENT",
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        alert(authData.message || "Auth registration failed");
        return;
      }

      const userId = authData?.user?.id;

      if (!userId) {
        alert("User created, but user ID was not returned");
        return;
      }

      const patientResponse = await fetch("http://localhost:5005/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: formData.fullName,
          email: formData.email,
          dateOfBirth: formData.dob,
          gender: formData.gender ? formData.gender.toUpperCase() : "",
          bloodGroup: formData.bloodGroup,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zip,
            country: formData.country,
          },
          allergies: formData.allergies
            ? formData.allergies.split(",").map((item) => item.trim()).filter(Boolean)
            : [],
          emergencyContact: {
            name: formData.emergencyName,
            relationship: formData.emergencyRelation,
            phone: formData.emergencyPhone,
          },
        }),
      });

      const patientData = await patientResponse.json();

      if (!patientResponse.ok) {
        alert(patientData.message || "Patient profile creation failed");
        return;
      }

      alert("Registration successful. Please login to continue.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Something went wrong during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-register-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <main className="patient-register-main">
        <section className="patient-left">
          <div className="patient-left-glow"></div>

          <div className="patient-brand">
            <div className="patient-brand-icon-box">
              <span className="material-symbols-outlined filled">
                medical_services
              </span>
            </div>
            <h1>MEDISPHERE</h1>
          </div>

          <div className="patient-hero">
            <span className="patient-badge">FUTURE OF TELEMEDICINE</span>

            <h2>
              Your health,
              <br />
              reimagined through
              <br />
              <span>fluid intelligence.</span>
            </h2>

            <p>
              Experience a clinical environment that prioritizes calm,
              precision, and personalized care. Join our community of patients
              embracing the next evolution of digital health.
            </p>

            <div className="patient-feature">
              <div className="patient-feature-avatars">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7C5VezybRKD2jkfL3U0nSsV1S55qhBV9R5Co00yo_o7ZYROA1onkg1BTU6OsfPCbdyDd3VkaJh8stC_eBTgn8fEtx4MY5x1RQosGFPu--x2-OqmB3Na3VvA6H5FhUxXoJXMOycApQrhru4KaU2f6PQzft8EMx0EXWTcxHuhUIsRGR1PUXU0NbvLgmo61AItG3jv1XZJI4eNiNKj5yklnpsPj-mT5EHJOYkMtvvpK7T08l4E3GaCTW2tb9FWMmkGnZz6ynVXfZmIc"
                  alt="clinician"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKBh40Sj4AtkeCqcqIPrdYJLMcSOvJafi7GE9DCpWo6uH_PXWMjQV8sF5IiuGcVrxvcv0-gNuKjE2VzwQb1zjadxMF-zlpLGSa6x9rxU5PCiWWM_bS22U52QwckT4qf10-eQBLSjwmThgSgwCz9qFadSLF1D70kKs5QIaZ1hDWzuW0Bk0EC2xudJE_csRYa9vnVYQ2FhIMOiGAJUV4IcijVwcGJbZ0Xuhw7ClVnshTrHEc10xn1euimywV5hRK8aqCmrlQ6_nriX4"
                  alt="clinician"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfWuoX_h2bXZJyz11AQKCwATcRmJiB0On9RRCWNMC54FPW6PdEY0F8Klv0ZQkcqgQVPxMk0aLS44__DpjF9Ga9WmbScpPkIam3J2PDI7Erl6BVGwlHWbuNE-IZaR6qeqoo-NrrBVULwWJd19E4s_REFRBWw0UF3Pnoru4RJF2UH-m7FTYRhdlXQsar-Gum_p9GhT2klQ9ZEgky8cHf7nRRuHY7HNKBBLpC3f1ERTvHMQGmAG2D2Y2PG49TieeotBSvlsgV-8wTFNU"
                  alt="clinician"
                />
              </div>

              <div>
                <p className="patient-feature-title">Top-tier AI Integration</p>
                <p className="patient-feature-sub">
                  Certified clinicians + Real-time health insights
                </p>
              </div>
            </div>
          </div>

          <div className="patient-preview-card">
            <div className="patient-preview-top">
              <div className="patient-preview-icon">
                <span className="material-symbols-outlined">
                  clinical_notes
                </span>
              </div>
              <div>
                <p className="patient-preview-title">AI Diagnostic Preview</p>
                <p className="patient-preview-text">
                  Patient data processing is encrypted and verified by clinical
                  standards.
                </p>
              </div>
            </div>
            <div className="patient-preview-bar">
              <div className="patient-preview-progress"></div>
            </div>
          </div>

          <div className="patient-bg-image"></div>
        </section>

        <section className="patient-right">
          <div className="patient-right-inner">
            <button
              type="button"
              className="patient-back-btn"
              onClick={() => navigate("/register")}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Role Selection
            </button>

            <div className="patient-header">
              <h3>Create your Health Profile</h3>
              <p>
                Complete your registration to unlock personalized health
                analytics.
              </p>
            </div>

            <form className="patient-form" onSubmit={handleSubmit}>
              <div className="patient-section">
                <div className="patient-section-title">
                  <span className="material-symbols-outlined">person</span>
                  <h4>Personal Information</h4>
                </div>

                <div className="patient-grid two">
                  <div className="field full">
                    <label>Full Name</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">badge</span>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Johnathan Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Date of Birth</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">
                        calendar_today
                      </span>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Gender</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">wc</span>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="patient-section">
                <div className="patient-section-title">
                  <span className="material-symbols-outlined">location_on</span>
                  <h4>Contact &amp; Address</h4>
                </div>

                <div className="patient-grid two">
                  <div className="field">
                    <label>Email Address</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">mail</span>
                      <input
                        type="email"
                        name="email"
                        placeholder="john@ethereal.health"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Phone Number</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">call</span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field full">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="street"
                      placeholder="123 Medical Boulevard"
                      value={formData.street}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Palo Alto"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field">
                    <label>State / Province</label>
                    <input
                      type="text"
                      name="state"
                      placeholder="CA"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field">
                    <label>Zip / Postal Code</label>
                    <input
                      type="text"
                      name="zip"
                      placeholder="94304"
                      value={formData.zip}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      placeholder="USA"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="patient-section">
                <div className="patient-section-title">
                  <span className="material-symbols-outlined">
                    monitor_heart
                  </span>
                  <h4>Health Profile</h4>
                </div>

                <div className="patient-grid two">
                  <div className="field">
                    <label>Blood Group</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">
                        bloodtype
                      </span>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                      >
                        <option value="">Select Group</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                        <option>O+</option>
                        <option>O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Known Allergies</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">warning</span>
                      <input
                        type="text"
                        name="allergies"
                        placeholder="Peanuts, Penicillin, etc."
                        value={formData.allergies}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="patient-section">
                <div className="patient-section-title">
                  <span className="material-symbols-outlined">
                    e911_emergency
                  </span>
                  <h4>Emergency Contact</h4>
                </div>

                <div className="patient-grid three">
                  <div className="field">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      name="emergencyName"
                      placeholder="Jane Doe"
                      value={formData.emergencyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="field">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="emergencyRelation"
                      placeholder="Spouse"
                      value={formData.emergencyRelation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="field">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      placeholder="+1 (555) 999-8888"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="patient-section">
                <div className="patient-section-title">
                  <span className="material-symbols-outlined">lock</span>
                  <h4>Account Security</h4>
                </div>

                <div className="patient-grid two">
                  <div className="field full">
                    <label>Username</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">
                        person_pin
                      </span>
                      <input
                        type="text"
                        name="username"
                        placeholder="johndoe88"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Password</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">key</span>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">
                        verified_user
                      </span>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="patient-terms">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and
                  acknowledge the{" "}
                  <a href="#">Privacy Policy</a> regarding HIPAA-compliant
                  clinical data processing.
                </label>
              </div>

              <button
                type="submit"
                className="patient-submit-btn"
                disabled={loading}
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            </form>

            <div className="patient-footer-note">
              <p>
                Already have an account?
                <button type="button" onClick={() => navigate("/login")}>
                  Login here
                </button>
              </p>

              <div className="patient-security-tags">
                <div>
                  <span className="material-symbols-outlined">encrypted</span>
                  <span>HIPAA Compliant</span>
                </div>
                <div>
                  <span className="material-symbols-outlined">security</span>
                  <span>256-bit AES SSL</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}