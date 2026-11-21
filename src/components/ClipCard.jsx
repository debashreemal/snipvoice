import React from 'react';
import { Check, X } from 'lucide-react';

// ClipCard with pastel mint approve and pastel red reject buttons, white score circle
export default function ClipCard({ clip, onApprove, onReject }) {
  const { id, timeRange, duration, hookLine, score, reason, status } = clip;
  const hookType = clip.hookType || clip.hook_type || 'Bold claim';
  const displayReason = reason || 'High-retention hook with a clear emotional takeaway for viewers.';

  return (
    <div className={`clip-card ${status === 'rejected' ? 'state-rejected' : ''}`}>
      {/* Top Row: Time range + duration + hook type badge on left; Score circle + Hook score label on right */}
      <div className="clip-card-top">
        <div className="clip-time-info">
          <span className="clip-timerange-text">{timeRange}</span>
          {duration && <span className="clip-duration-text">{duration}</span>}
          <span className="clip-hook-type-pill">{hookType}</span>
        </div>

        <div className="clip-score-column">
          <div className="clip-score-circle" title="Hook Score">
            {score}
          </div>
          <span className="clip-score-caption">Hook score</span>
        </div>
      </div>

      {/* Main Hook Line */}
      <div className="clip-hook-text">
        &ldquo;{hookLine}&rdquo;
      </div>

      {/* Prominent Selection Reason Box */}
      <div className="clip-reason-box">
        <span className="clip-reason-tag">WHY THIS MOMENT WAS PICKED</span>
        <p className="clip-reason-text">{displayReason}</p>
      </div>

      {/* Bottom Row: Right-aligned pastel Approve and Reject buttons */}
      <div className="clip-actions-row">
        <button
          type="button"
          onClick={() => onApprove(id)}
          disabled={status === 'approved'}
          className={`btn-action-pill btn-approve-pill ${status === 'approved' ? 'is-approved' : ''}`}
        >
          <Check size={16} strokeWidth={2.5} />
          <span>{status === 'approved' ? 'Approved' : 'Approve'}</span>
        </button>
        <button
          type="button"
          onClick={() => onReject(id)}
          className={`btn-action-pill btn-reject-pill ${status === 'rejected' ? 'is-rejected' : ''}`}
        >
          <X size={16} strokeWidth={2.5} />
          <span>{status === 'rejected' ? 'Rejected' : 'Reject'}</span>
        </button>
      </div>
    </div>
  );
}
