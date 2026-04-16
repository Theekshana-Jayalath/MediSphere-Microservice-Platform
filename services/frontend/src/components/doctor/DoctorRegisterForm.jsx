import React, { useState } from "react";
import { registerDoctor } from "../../services/doctor/doctorService.js";
import "../../styles/Doctor/doctorRegister.css";

let DoctorRegisterForm = () => {
  let specializationOptions = [
    "Cardiologist",
    "Neurologist",
    "Dermatologist",
    "Nephrologist",
    "Gastroenterologist",
    "Radiologist",
    "Oncologist",
    "Endocrinologist",
    "Pulmonologist",
    "Rheumatologist",
  ];

  let [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    experienceYears: "",
    baseHospital: "",
    channelingHospitals: "",
    consultationFee: "",
  });

  let [errors, setErrors] = useState({});
  let [isSubmitting, setIsSubmitting] = useState(false);
  let [successMessage, setSuccessMessage] = useState("");
  let [serverError, setServerError] = useState("");

  let handleChange = (event) => {
    let { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  let validateForm = () => {
    let newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = "Specialization is required";
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    }

    if (formData.experienceYears === "") {
      newErrors.experienceYears = "Experience years is required";
    } else if (Number(formData.experienceYears) < 0) {
      newErrors.experienceYears = "Experience years cannot be negative";
    }

    if (!formData.baseHospital.trim()) {
      newErrors.baseHospital = "Base hospital is required";
    }

    if (formData.consultationFee === "") {
      newErrors.consultationFee = "Consultation fee is required";
    } else if (Number(formData.consultationFee) < 0) {
      newErrors.consultationFee = "Consultation fee cannot be negative";
    }

    setErrors(newErrors);

    return newErrors;
  };

  let handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setServerError("");

    let validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setServerError("Please correct the highlighted fields and try again.");

      let firstErrorFieldName = Object.keys(validationErrors)[0];
      let firstErrorField = document.querySelector(
        `[name="${firstErrorFieldName}"]`
      );

      if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    setIsSubmitting(true);

    try {
      let payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        experienceYears: Number(formData.experienceYears),
        baseHospital: formData.baseHospital.trim(),
        channelingHospitals: formData.channelingHospitals
          .split(",")
          .map((hospital) => hospital.trim())
          .filter((hospital) => hospital !== ""),
        consultationFee: Number(formData.consultationFee),
      };

      let response = await registerDoctor(payload);

      if (response.success) {
        setSuccessMessage(
          response.message ||
            "Doctor registration submitted successfully and pending admin approval."
        );

        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          specialization: "",
          licenseNumber: "",
          experienceYears: "",
          baseHospital: "",
          channelingHospitals: "",
          consultationFee: "",
        });
        setErrors({});
      }
    } catch (error) {
      console.error("Registration error:", error);

      const errorMsg = !error.response
        ? "Cannot reach Doctor Service. Please check service status and try again."
        : error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again.";

      setServerError(errorMsg);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="doctor-register-page">
      <div className="doctor-register-left-panel">
        <div className="doctor-register-brand">
          <div className="doctor-register-logo-box">+</div>
          <h2>MEDISPHERE</h2>
        </div>

        <div className="doctor-register-left-content">
          <span className="doctor-register-badge">DOCTOR ONBOARDING</span>
          <h1>
            Your medical
            <br />
            expertise,
            <br />
            <span>digitally elevated.</span>
          </h1>
          <p>
            Join the future of telemedicine with a secure and professional doctor
            portal. Register your profile, share your specialization, and manage
            your consultation availability with ease.
          </p>

          <div className="doctor-register-highlight-box">
            <h4>Professional Verification</h4>
            <p>
              Every doctor registration is reviewed by the admin before account
              approval and dashboard access.
            </p>
            <div className="doctor-register-progress-bar">
              <div className="doctor-register-progress-fill"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="doctor-register-right-panel">
        <div className="doctor-register-form-wrapper">
          <button
            type="button"
            className="doctor-register-back-link"
            onClick={() => window.history.back()}
          >
            ← Back to Role Selection
          </button>

          <h2>Create Your Doctor Profile</h2>
          <p className="doctor-register-subtitle">
            Complete your registration to join the MediSphere telemedicine network.
          </p>

          {successMessage && (
            <div className="doctor-register-success-message">
              {successMessage}
            </div>
          )}

          {serverError && (
            <div className="doctor-register-error-message">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="doctor-register-form">
            <div className="doctor-register-section">
              <div className="doctor-register-section-header">
                <h3>Personal Information</h3>
              </div>

              <div className="doctor-register-grid two-columns">
                <div className="doctor-register-field full-width">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Dr. John Doe"
                  />
                  {errors.fullName && (
                    <span className="field-error">{errors.fullName}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="doctor@email.com"
                  />
                  {errors.email && (
                    <span className="field-error">{errors.email}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0771234567"
                  />
                  {errors.phone && (
                    <span className="field-error">{errors.phone}</span>
                  )}
                </div>

              </div>
            </div>

            <div className="doctor-register-section">
              <div className="doctor-register-section-header">
                <h3>Professional Information</h3>
              </div>

              <div className="doctor-register-grid two-columns">
                <div className="doctor-register-field">
                  <label>Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  >
                    <option value="">Select specialization</option>
                    {specializationOptions.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                  {errors.specialization && (
                    <span className="field-error">{errors.specialization}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="SLMC-12345"
                  />
                  {errors.licenseNumber && (
                    <span className="field-error">{errors.licenseNumber}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Experience Years</label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    placeholder="5"
                  />
                  {errors.experienceYears && (
                    <span className="field-error">{errors.experienceYears}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Consultation Fee (LKR)</label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    placeholder="3000"
                  />
                  {errors.consultationFee && (
                    <span className="field-error">{errors.consultationFee}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Base Hospital</label>
                  <input
                    type="text"
                    name="baseHospital"
                    value={formData.baseHospital}
                    onChange={handleChange}
                    placeholder="National Hospital"
                  />
                  {errors.baseHospital && (
                    <span className="field-error">{errors.baseHospital}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Channeling Hospitals</label>
                  <input
                    type="text"
                    name="channelingHospitals"
                    value={formData.channelingHospitals}
                    onChange={handleChange}
                    placeholder="Asiri Hospital, Lanka Hospital"
                  />
                  <span className="field-hint">
                    Enter hospitals separated by commas
                  </span>
                </div>
              </div>
            </div>

            <div className="doctor-register-section">
              <div className="doctor-register-section-header">
                <h3>Account Security</h3>
              </div>

              <div className="doctor-register-grid two-columns">
                <div className="doctor-register-field">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <span className="field-error">{errors.password}</span>
                  )}
                </div>

                <div className="doctor-register-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <span className="field-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="doctor-register-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </button>

            {serverError && (
              <div className="doctor-register-error-message inline-submit-error">
                {serverError}
              </div>
            )}

            <p className="doctor-register-footer-text">
              Already registered? Wait for admin approval before accessing your
              doctor dashboard.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegisterForm;