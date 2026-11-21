import React from 'react';

// Side-by-side view of Original vs Edited caption
export default function BeforeAfterPanel({ original, edited, current, platformName, onClose }) {
  const editedText = edited ?? current ?? '';

  return (
    <div className="before-after-overlay" onClick={onClose}>
      <div className="before-after-modal" onClick={(e) => e.stopPropagation()}>
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
              {original || 'No original caption available'}
            </div>
          </div>

          {/* Edited Column */}
          <div className="before-after-col">
            <span className="before-after-label">YOUR EDITED VERSION</span>
            <div className="before-after-text-box edited-box">
              {editedText || (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No edits made yet. Edit the caption in the text box and click &quot;Save edit&quot;.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
