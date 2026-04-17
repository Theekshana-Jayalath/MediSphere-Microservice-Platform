import React, { useState } from "react";

const ConsultationType = ({ onSelect, selectedType, setSelectedType }) => {
  const consultationTypes = [
    {
      id: "online",
      name: "Online Video",
      description: "Secure telehealth session",
      icon: "💻",
      color: "#4A90E2"
    },
    {
      id: "inperson",
      name: "In-Person",
      description: "At our central clinic",
      icon: "🏥",
      color: "#2C3E50"
    }
  ];

  const handleSelect = (type) => {
    setSelectedType(type.id);
    if (onSelect) {
      onSelect(type);
    }
  };

  return (
    <div className="consultation-types-container">
      {consultationTypes.map((type) => (
        <button
          key={type.id}
          className={`consultation-type-btn ${selectedType === type.id ? 'active' : ''}`}
          onClick={() => handleSelect(type)}
        >
          <div className="consultation-type-btn-content">
            <div className="consultation-type-icon" style={{ backgroundColor: `${type.color}15` }}>
              <span>{type.icon}</span>
            </div>
            <div className="consultation-type-info">
              <div className="consultation-type-name">{type.name}</div>
              <div className="consultation-type-description">{type.description}</div>
            </div>
            {selectedType === type.id && (
              <div className="consultation-type-check">✓</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConsultationType;