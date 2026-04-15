import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth/Register.css";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <main className="register-main">
        <section className="register-left">
          <div className="register-left-glow"></div>

          <div className="register-brand">
            <div className="register-brand-icon-box">
              <span className="material-symbols-outlined filled">medical_services</span>
            </div>
            <h1>MEDISPHERE</h1>
          </div>

          <div className="register-hero">
            <span className="register-badge">FUTURE OF TELEMEDICINE</span>

            <h2>
              Your health,
              <br />
              reimagined through
              <br />
              <span>fluid intelligence.</span>
            </h2>

            <p>
              Experience a clinical environment that prioritizes calm, precision,
              and personalized care. Join our community of patients embracing the
              next evolution of digital health.
            </p>

            <div className="register-feature">
              <div className="register-feature-avatars">
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
                <p className="register-feature-title">Top-tier AI Integration</p>
                <p className="register-feature-sub">
                  Certified clinicians + Real-time health insights
                </p>
              </div>
            </div>
          </div>

          <div className="register-preview-card">
            <div className="register-preview-top">
              <div className="register-preview-icon">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
              <div>
                <p className="register-preview-title">AI Diagnostic Preview</p>
                <p className="register-preview-text">
                  Patient data processing is encrypted and verified by clinical
                  standards.
                </p>
              </div>
            </div>
            <div className="register-preview-bar">
              <div className="register-preview-progress"></div>
            </div>
          </div>

          <div className="register-bg-image"></div>
        </section>

        <section className="register-right">
          <div className="register-right-inner">
            <div className="register-header">
              <h3>Welcome to MEDISPHERE</h3>
              <p>Please select your role to begin the registration process.</p>
            </div>

            <div className="register-role-list">
              <button
                type="button"
                className="register-role-card"
                onClick={() => navigate("/register/patient")}
              >
                <div className="register-role-icon">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h4>Patient</h4>
                  <p>Access your health records and book consultations.</p>
                </div>
              </button>

              <button
                type="button"
                className="register-role-card"
                onClick={() => navigate("/doctor/register")}
              >
                <div className="register-role-icon">
                  <span className="material-symbols-outlined">medical_information</span>
                </div>
                <div>
                  <h4>Doctor</h4>
                  <p>Manage your patients and clinical schedules.</p>
                </div>
              </button>

              
            </div>

            <p className="register-login-text">
              Already have an account?
              <button type="button" onClick={() => navigate("/login")}>
                Login here
              </button>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}