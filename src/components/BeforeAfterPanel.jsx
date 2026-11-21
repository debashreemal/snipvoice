import React from 'react';

// Side-by-side view of Original vs Edited caption
export default function BeforeAfterPanel({ original, edited, platformName, onClose }) {
  return (
    <div className="before-after-overlay">
      <div className="before-after-modal">
        <div className="before-after-header">
          <h4 className="before-after-title">
            Before and after: {platformName}
          </h4>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="before-after-grid">
          {/* Original Column */}
          <div className="before-after-col">
            <span className="before-after-label">ORIGINAL CAPTION</span>
            <div className="before-after-text-box">
              {original}
            </div>
          </div>

          {/* Edited Column */}
          <div className="before-after-col">
            <span className="before-after-label">YOUR EDITED VERSION</span>
            <div className="before-after-text-box edited-box">
              {edited}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
