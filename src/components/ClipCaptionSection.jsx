import React from 'react';
import { PLATFORMS } from '../data/mock';
import CaptionCard from './CaptionCard';

// Section grouping 3 platform caption cards for an approved clip within a project
export default function ClipCaptionSection({ clip, projectId }) {
  const { id, hookLine, timeRange } = clip;

  return (
    <section className="clip-caption-section">
      {/* Section Header: Hook Line and Time Range */}
      <div className="clip-caption-header">
        <h3 className="clip-caption-hook">
          "{hookLine}"
        </h3>
        <span className="clip-caption-time">
          {timeRange}
        </span>
      </div>

      {/* 3 Caption Cards Grid */}
      <div className="caption-cards-grid">
        {PLATFORMS.map((platform) => (
          <CaptionCard
            key={platform.id}
            clipId={id}
            platform={platform}
            projectId={projectId}
          />
        ))}
      </div>
    </section>
  );
}
