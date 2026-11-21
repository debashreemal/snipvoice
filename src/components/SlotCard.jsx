import React from 'react';
import { Instagram, Linkedin, Twitter, Video, Check, Clock } from 'lucide-react';

// Platform icon helper
function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={13} strokeWidth={2.4} />;
    case 'linkedin':
      return <Linkedin size={13} strokeWidth={2.4} />;
    case 'x':
      return <Twitter size={13} strokeWidth={2.4} />;
    case 'youtube':
    default:
      return <Video size={13} strokeWidth={2.4} />;
  }
}

// Rich SlotCard inside day columns on the calendar with all necessary details
export default function SlotCard({ slot, onSelect }) {
  const {
    hookLine,
    hookType,
    platform,
    platformName,
    time,
    isPosted,
    projectName,
    reason,
    clipReason
  } = slot;

  const displayHookType = hookType || 'Bold claim';
  const strategicReason = reason || clipReason || 'Peak audience engagement window';

  return (
    <div
      className={`slot-card ${isPosted ? 'is-posted' : ''}`}
      onClick={() => onSelect(slot)}
      title="Click to view details, reschedule, or mark as posted"
    >
      {/* Top row: Platform info & Status pill */}
      <div className="slot-card-header">
        <div className={`slot-platform-pill platform-${platform}`}>
          {getPlatformIcon(platform)}
          <span className="slot-platform-label">{platformName}</span>
        </div>

        <div className="slot-status-container">
          {isPosted ? (
            <span className="slot-status-posted">
              <Check size={11} strokeWidth={3} />
              Posted
            </span>
          ) : (
            <span className="slot-status-scheduled">Scheduled</span>
          )}
        </div>
      </div>

      {/* Time & Hook Type Badges */}
      <div className="slot-meta-row">
        <div className="slot-time-pill">
          <Clock size={11} strokeWidth={2.4} />
          <span>{time}</span>
        </div>
        <span className="slot-hook-pill">{displayHookType}</span>
      </div>

      {/* Main Hook preview */}
      <div className="slot-hook-text">
        &ldquo;{hookLine}&rdquo;
      </div>

      {/* Why this slot rationale callout */}
      <div className="slot-rationale-box" title={strategicReason}>
        <span className="slot-rationale-tag">WHY:</span>
        <span className="slot-rationale-text">{strategicReason}</span>
      </div>

      {/* Project name tag */}
      {projectName && (
        <div className="slot-footer-row">
          <span className="slot-project-pill" title={projectName}>
            {projectName}
          </span>
        </div>
      )}
    </div>
  );
}
