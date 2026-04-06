import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/Patient/PatientSidebar";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
} from "../../services/patientApi";
import "./../../styles/Patient/PatientProfile.css";

export default function PatientProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const storedPatientProfile = localStorage.getItem("patientProfile");
  const savedPatientProfile = storedPatientProfile
    ? JSON.parse(storedPatientProfile)
    : null;

  const [profile, setProfile] = useState({
    patientId: savedPatientProfile?.patientId || "",
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    street: "",
    city: "",
    postalCode: "",
    bloodGroup: "",
    gender: "",
    emergencyName: "",
    relationship: "",
    emergencyPhone: "",
  });

  const [originalProfile, setOriginalProfile] = useState({
    patientId: savedPatientProfile?.patientId || "",
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    street: "",
    city: "",
    postalCode: "",
    bloodGroup: "",
    gender: "",
    emergencyName: "",
    relationship: "",
    emergencyPhone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await getMyPatientProfile();
        const data = response.data;

        const formattedProfile = {
          patientId: data?.patientId || savedPatientProfile?.patientId || "",
          fullName: data?.name || "",
          email: data?.email || "",
          phone: data?.phone || "",
          dob: data?.dateOfBirth
            ? new Date(data.dateOfBirth).toISOString().split("T")[0]
            : "",
          street: data?.address?.street || "",
          city: data?.address?.city || "",
          postalCode: data?.address?.zipCode || "",
          bloodGroup: data?.bloodGroup || "",
          gender: data?.gender || "",
          emergencyName: data?.emergencyContact?.name || "",
          relationship: data?.emergencyContact?.relationship || "",
          emergencyPhone: data?.emergencyContact?.phone || "",
        };

        setProfile(formattedProfile);
        setOriginalProfile(formattedProfile);

        localStorage.setItem(
          "patientProfile",
          JSON.stringify({
            ...savedPatientProfile,
            patientId: data?.patientId || savedPatientProfile?.patientId || "",
            name: data?.name || "",
            fullName: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            dateOfBirth: data?.dateOfBirth || "",
            bloodGroup: data?.bloodGroup || "",
            gender: data?.gender || "",
            address: data?.address || {},
            emergencyContact: data?.emergencyContact || {},
          })
        );
      } catch (error) {
        console.error("Failed to fetch patient profile:", error);
        alert(
          error?.response?.data?.message || "Failed to load patient profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("patientProfile");
    localStorage.removeItem("patientVitals");
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: profile.fullName,
        email: profile.email,
        dateOfBirth: profile.dob,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        phone: profile.phone,
        address: {
          street: profile.street,
          city: profile.city,
          zipCode: profile.postalCode,
        },
        emergencyContact: {
          name: profile.emergencyName,
          relationship: profile.relationship,
          phone: profile.emergencyPhone,
        },
      };

      const response = await updateMyPatientProfile(payload);
      const updated = response.data?.patient;

      const updatedProfile = {
        patientId: updated?.patientId || profile.patientId,
        fullName: updated?.name || profile.fullName,
        email: updated?.email || profile.email,
        phone: updated?.phone || profile.phone,
        dob: updated?.dateOfBirth
          ? new Date(updated.dateOfBirth).toISOString().split("T")[0]
          : profile.dob,
        street: updated?.address?.street || profile.street,
        city: updated?.address?.city || profile.city,
        postalCode: updated?.address?.zipCode || profile.postalCode,
        bloodGroup: updated?.bloodGroup || profile.bloodGroup,
        gender: updated?.gender || profile.gender,
        emergencyName:
          updated?.emergencyContact?.name || profile.emergencyName,
        relationship:
          updated?.emergencyContact?.relationship || profile.relationship,
        emergencyPhone:
          updated?.emergencyContact?.phone || profile.emergencyPhone,
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setIsEditing(false);

      localStorage.setItem(
        "patientProfile",
        JSON.stringify({
          ...savedPatientProfile,
          patientId: updated?.patientId || profile.patientId,
          name: updated?.name || profile.fullName,
          fullName: updated?.name || profile.fullName,
          email: updated?.email || profile.email,
          phone: updated?.phone || profile.phone,
          dateOfBirth: updated?.dateOfBirth || profile.dob,
          bloodGroup: updated?.bloodGroup || profile.bloodGroup,
          gender: updated?.gender || profile.gender,
          address: updated?.address || {
            street: profile.street,
            city: profile.city,
            zipCode: profile.postalCode,
          },
          emergencyContact: updated?.emergencyContact || {
            name: profile.emergencyName,
            relationship: profile.relationship,
            phone: profile.emergencyPhone,
          },
        })
      );

      alert("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(error?.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="patient-profile-page">
        <main className="patient-main">
          <div className="profile-container">
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  const displayPatientId =
    profile.patientId || savedPatientProfile?.patientId || "------";

  return (
    <div className="patient-profile-page">
      <PatientSidebar
        patientName={profile.fullName || user?.name || "Patient"}
        patientId={displayPatientId}
        activeItem="profile"
        onLogout={handleLogout}
      />

      <main className="patient-main">
        <header className="patient-topbar">
          <div className="search-box">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search records..." />
          </div>

          <div className="topbar-right">
            <button className="icon-btn" type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <div className="top-user-info">
              <div>
                <h4>{profile.fullName || user?.name || "Patient"}</h4>
                <p>Patient ID: #{displayPatientId}</p>
              </div>
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="patient"
                className="top-avatar"
              />
            </div>
          </div>
        </header>

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-image-wrapper">
              <img
                src="https://i.pravatar.cc/200?img=12"
                alt="Profile"
                className="profile-image"
              />
              <button type="button" className="camera-btn">
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>

            <div className="profile-title-block">
              <span className="profile-badge">Profile Settings</span>
              <h1>{profile.fullName || user?.name || "Patient"}</h1>
              <p>
                <span className="material-symbols-outlined">verified_user</span>
                Account Active since January 2023
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="edit-profile-btn"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <section className="profile-card">
              <div className="section-title">
                <div className="section-icon blue">
                  <span className="material-symbols-outlined">person_edit</span>
                </div>
                <h3>Personal Identity</h3>
              </div>

              <div className="form-grid two-cols">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </section>

            <div className="middle-grid">
              <section className="profile-card">
                <div className="section-title">
                  <div className="section-icon light-blue">
                    <span className="material-symbols-outlined">
                      location_on
                    </span>
                  </div>
                  <h3>Residential Address</h3>
                </div>

                <div className="form-grid one-col">
                  <div className="form-group">
                    <input
                      type="text"
                      name="street"
                      value={profile.street}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Street Address"
                    />
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <input
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="City"
                      />
                    </div>

                    <div className="form-group">
                      <input
                        type="text"
                        name="postalCode"
                        value={profile.postalCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="health-card">
                <h3>Health Stats</h3>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={profile.bloodGroup}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </section>
            </div>

            <section className="profile-card glass-card-custom">
              <div className="section-title">
                <div className="section-icon pink">
                  <span className="material-symbols-outlined">
                    emergency_share
                  </span>
                </div>
                <h3>Emergency Contact</h3>
              </div>

              <div className="form-grid two-cols">
                <div className="form-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={profile.emergencyName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    name="relationship"
                    value={profile.relationship}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Emergency Phone</label>
                  <input
                    type="text"
                    name="emergencyPhone"
                    value={profile.emergencyPhone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </section>

            {isEditing && (
              <div className="action-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            )}
          </form>

          <div className="bottom-note">
            <p>
              Changes to your core medical identity may require secondary
              verification by a health administrator for security purposes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}