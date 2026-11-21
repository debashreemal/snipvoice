import React from 'react';

// Flat StatCard using --sky-card with 20px corners
export default function StatCard({ label, value, sublabel, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && <Icon size={18} className="stat-card-icon" />}
      </div>
      <div className="stat-card-value">{value}</div>
      {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
    </div>
  );
}
