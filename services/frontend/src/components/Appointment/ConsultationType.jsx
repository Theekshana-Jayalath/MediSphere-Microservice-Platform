import React, { useState } from "react";

const ConsultationType = () => {
  const [selected, setSelected] = useState("online");

  const Card = ({ id, title, subtitle, price, icon }) => (
    <div
      className={`consultation-box ${selected === id ? "active" : ""}`}
      onClick={() => setSelected(id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <h4 style={{ margin: 0 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ms-mid)' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ fontWeight: 600 }}>{price}</div>
    </div>
  );

  return (
    <div className="consultation-wrapper">
      <Card id="online" title="Online Video" subtitle="Secure telehealth session" icon="📹" />
      <Card id="clinic" title="In-Person" subtitle="At our central clinic" icon="🏥" />
    </div>
  );
};

export default ConsultationType;