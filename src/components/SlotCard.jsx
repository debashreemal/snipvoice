import React from 'react';
import { Instagram, Linkedin, Twitter, Video, Check } from 'lucide-react';

// Platform icon helper
function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={14} strokeWidth={2.2} />;
    case 'linkedin':
      return <Linkedin size={14} strokeWidth={2.2} />;
    case 'x':
      return <Twitter size={14} strokeWidth={2.2} />;
    case 'youtube':
    default:
      return <Video size={14} strokeWidth={2.2} />;
  }
}

// SlotCard inside day columns on the calendar with small project tag
export default function SlotCard({ slot, onSelect }) {
  const { hookLine, platform, platformName, time, isPosted, projectName } = slot;

  return (
    <div
      className={`slot-card ${isPosted ? 'is-posted' : ''}`}
      onClick={() => onSelect(slot)}
      title="Click to view or edit slot"
    >
      {/* Project name tag */}
      {projectName && (
        <span className="slot-project-pill" title={projectName}>
          {projectName}
        </span>
      )}

      {/* Top row: Platform info & Time */}
      <div className="slot-card-meta">
        <div className="slot-platform-badge">
          {getPlatformIcon(platform)}
          <span className="slot-platform-name">{platformName}</span>
        </div>
        <span className="slot-time-text">{time}</span>
      </div>

      {/* Hook line clamped to 2 lines */}
      <div className="slot-hook-text">
        {hookLine}
      </div>

      {/* Posted badge when slot has been marked as posted */}
      {isPosted && (
        <div className="slot-posted-tag">
          <Check size={12} strokeWidth={3} />
          <span>Posted</span>
        </div>
      )}
    </div>
  );
}
