import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Home/Home.css";

const specialties = [
  { icon: "favorite", title: "Cardiology" },
  { icon: "neurology", title: "Neurology" },
  { icon: "child_care", title: "Pediatrics" },
  { icon: "psychology", title: "Mental Health" },
  { icon: "spa", title: "Skin Care" },
  { icon: "biotech", title: "Oncology" },
];

const doctors = [
  {
    specialty: "Cardiology",
    name: "Dr. Julian Sterling",
    rating: "4.9",
    desc: "Harvard Medical graduate with 15+ years of experience in advanced cardiovascular surgery.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxKrRwVSjjINdoZBvVYLokLCrAntCru-3J-1VmKtzP51o5kFgzRo5d4aKcEhZsK6NzqPiFyOdfiSwK95shanxurO9lak8DlcqmXJz2iD4j6yq9EQ6i0e5TqPDl24O2YJCywohal77CKsxKrDO9wEaOXPyL7QzmrxG_LCzAnyI3jPyywu_lZ-Jj9_OK-P6g2BkwPYmbdVsR0HioveifFKDWZhXMxpaEiJwhb0VFg7stSVIaXF3yVg6j1HwEtWtxrqQtjSyf1a73Bo4",
  },
  {
    specialty: "Neurology",
    name: "Dr. Elena Voss",
    rating: "4.8",
    desc: "Specializing in cognitive behavioral therapy and advanced neuro-regeneration techniques.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbQhkMQh8bMIYp3aeGrHLYzzPk2dkZcO20mSuQsXJC5gh1bncSyE4QkE6MPyoTPgHc-69NVgsbmvTJml_vq12U97sR_p78W0r3GLI--O_KuN_RC3TQOEGxl9wb2n_Z2njXxqX56d3aZpx5yoWu790KU5G7erhDhrRKuYQmV9_cxeJGhwVa8J6bYyG3GMNeBU8cQutzEjgGhDmlnlIRFGhYFVhJH-U8ahJ8tse6IiyLwN7B26LXW6J9d9p49CzNEHxWStpzEGMj99M",
  },
  {
    specialty: "Pediatrics",
    name: "Dr. Marcus Chen",
    rating: "5.0",
    desc: "Dedicated to holistic child wellness and early developmental diagnostics with 10 years of care.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuByzIPn6BeNy9KoZZLBD9pAzB_WVqLMJE8paSimYf8UNSVbCnptZyPsODTTsmSKP0TY4Y5jFCtDOUVWukjuYRvOnoos9zZHoCuhwuV_iKZfMWg7uaR74PgD92iUlebAn1UDzRyXRjjhhI7ucajoWoq54bS5a8YHhBPc7L_KHph5xZvFfsvIaZ0HWo3xbAwU3kYVJgL-zrayNu374Ng6f8eD9rhEV5U9ujvDgRMSkoNLtqdwfXF-Q2cS_aw6zFnqM_nUJoOFgHv7rlc",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">MEDISPHERE</div>

          <div className="nav-links">
            <a href="#" className="active">Home</a>
            <a href="#">Doctors</a>
            <a href="#">Services</a>
          </div>

          <div className="nav-actions">
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <button
              className="register-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-text">
              <h1>
                Book Doctor <br /> Appointment <span>Online</span>
              </h1>
              <p>
                Experience the future of healthcare. Direct access to premium
                specialists with seamless diagnostic workflows and translucent
                medical transparency.
              </p>

              <div className="hero-buttons">
                <button className="primary-btn">Find Doctors</button>
                <button className="secondary-btn">How it Works</button>
              </div>
            </div>

            <div className="hero-image-wrap">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKmcWV47rd0yNHFHFjEHjISHPrTeLXkK-T9s_bSKZ-uzdQ8fqR5nnfioewh2t3l1ufaXen-a5tuar0kTmSdtGvjeHJ2tCCp6dqlkctoH-GFLYiUavPgOOSCPWMZhT3T8tvrUAoIyanwSwC4eHcGkq4ju9BiUSiUgVBlwFA31e4_31pSMT-stIpJ17JyFkmg_lRvp6RvmGna8DTz--YEmZrPVwLnUw5wjBHyvq0jh5r0KQdAQVd-UIO1t7tNOgEFTB7wqlcbl6oHH0"
                alt="Doctor"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        <section className="specialties">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Search by Specialty</h2>
                <p>
                  Access world-class expertise across multiple clinical domains.
                </p>
              </div>
              <button className="view-all">View All</button>
            </div>

            <div className="specialty-grid">
              {specialties.map((item, index) => (
                <div className="specialty-card" key={index}>
                  <div className="specialty-icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <h3>{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="featured">
          <div className="container">
            <h2 className="center-title">Our Featured Specialists</h2>
            <div className="doctor-grid">
              {doctors.map((doctor, index) => (
                <div className="doctor-card" key={index}>
                  <div className="doctor-image-wrap">
                    <img src={doctor.image} alt={doctor.name} className="doctor-image" />
                    <div className="rating">★ {doctor.rating}</div>
                  </div>
                  <div className="doctor-content">
                    <p className="doctor-specialty">{doctor.specialty}</p>
                    <h3>{doctor.name}</h3>
                    <p className="doctor-desc">{doctor.desc}</p>
                    <button className="outline-btn">Book Appointment</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="services">
          <div className="container">
            <div className="services-head">
              <h2>Experience Ethereal Services</h2>
              <p>
                Modern healthcare requires more than just a visit. We provide a
                full digital health ecosystem.
              </p>
            </div>

            <div className="services-grid">
              <div className="service-card glass">
                <span className="material-symbols-outlined service-icon">videocam</span>
                <h3>Telemedicine</h3>
                <p>
                  High-definition video consultations with immediate access to
                  prescription management.
                </p>
                <a href="#">Learn More</a>
              </div>

              <div className="service-card glass">
                <span className="material-symbols-outlined service-icon">cloud_upload</span>
                <h3>Encrypted Vault</h3>
                <p>
                  Securely upload and manage your lab results. Shared instantly
                  with your selected physician.
                </p>
                <a href="#">Upload Now</a>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="container how-grid">
            <div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj21dTN8QnFa9rFbLpI4Rh-ID82q4Ot6t0LWKINUaPASYGPSKw33lZwZYr2U96-_79MdoKsW53Jch-uoJGlqVqEaU1M_Ae1G3RNEa0hC_kvk1zAZ4J0bViOsshO5I1hy_feB9BPKx3xxgoo5vmMAVBmSK7143eSdsIk2D4IgEFGRNWeDHB3_GufePbHDOvy6NL-lGbfnHmsjCKYcmgmESUO85cFdjYLRLlFp8JI_Wsq9SOMPtA75waK5XlcDE-Li2VCQwqodADexM"
                alt="How it works"
                className="how-image"
              />
            </div>

            <div>
              <h2>How it Works</h2>

              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div>
                    <h4>Find Your Specialist</h4>
                    <p>
                      Browse through our curated list of world-class doctors to
                      find the best match for your specific medical needs.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <div>
                    <h4>Book Your Slot</h4>
                    <p>
                      Select a time that works for you. Our real-time calendar
                      syncing ensures zero overlap and immediate confirmation.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">3</div>
                  <div>
                    <h4>Secure Consultation</h4>
                    <p>
                      Connect via our encrypted HD video platform. Receive
                      digital prescriptions and summaries instantly after the
                      session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-top">
          <div className="footer-left">
            <div className="footer-logo">MEDISPHERE</div>
            <p>
              © 2024 MEDISPHERE. All health data is encrypted. Premium
              concierge medical services for the modern era.
            </p>
          </div>

          <div className="footer-links">
            <a href="#">Contact</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>

        <div className="footer-bottom">
          Certified Telemedicine Provider | HIPAA Compliant | AES-256 Encryption
        </div>
      </footer>
    </div>
  );
}