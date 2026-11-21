import React, { useState } from 'react';
import { Instagram, Linkedin, Twitter, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import BeforeAfterPanel from './BeforeAfterPanel';

// Individual caption card per platform for a specific project
export default function CaptionCard({ clipId, platform, projectId }) {
  const { id: platformId, name, maxChars } = platform;
  const { getCaptionData, updateCaptionText, saveCaptionEdit, regenerateCaption } = useAppContext();

  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  const captionData = getCaptionData(projectId, clipId, platformId);
  const { text, original, voiceMatch, isEdited } = captionData;

  const currentLength = text?.length || 0;
  const isOverLimit = maxChars && currentLength > maxChars;

  // Icon mapping
  const renderIcon = () => {
    if (platformId === 'instagram') return <Instagram size={16} strokeWidth={2.2} />;
    if (platformId === 'linkedin') return <Linkedin size={16} strokeWidth={2.2} />;
    return <Twitter size={16} strokeWidth={2.2} />;
  };

  return (
    <div className="caption-card">
      {/* Top row: Platform name, icon, character count (no color dot) */}
      <div className="caption-card-header">
        <div className="caption-platform-info">
          <span className="caption-platform-icon">{renderIcon()}</span>
          <span className="caption-platform-name">{name}</span>
        </div>

        <div className={`caption-char-count ${isOverLimit ? 'over-limit' : ''}`}>
          {maxChars ? `${currentLength} / ${maxChars}` : `${currentLength} chars`}
        </div>
      </div>

      {/* Editable Textarea: white background, no border, 16px padding */}
      <textarea
        className="caption-textarea"
        rows={6}
        value={text || ''}
        onChange={(e) => updateCaptionText(projectId, clipId, platformId, e.target.value)}
        placeholder={`Draft ${name} caption...`}
      />

      {/* Voice Match Line + Flat Progress Bar */}
      <div className="caption-voice-match-section">
        <div className="caption-voice-match-header">
          <span className="caption-voice-label">Voice match</span>
          <span className="caption-voice-percent">{voiceMatch}%</span>
        </div>
        <div className="caption-voice-track">
          <div
            className="caption-voice-bar"
            style={{ width: `${Math.min(100, voiceMatch)}%` }}
          />
        </div>
      </div>

      {/* Bottom Action Row: Save edit, Regenerate, See before & after */}
      <div className="caption-actions-row">
        <div className="caption-primary-actions">
          <button
            type="button"
            className="btn-save-edit"
            onClick={() => saveCaptionEdit(projectId, clipId, platformId)}
          >
            {isEdited ? 'Update edit' : 'Save edit'}
          </button>

          <button
            type="button"
            className="btn-regenerate"
            onClick={() => regenerateCaption(projectId, clipId, platformId)}
            title="Regenerate caption with your learned style"
          >
            <RefreshCw size={14} strokeWidth={2.2} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* See before & after button */}
        <button
          type="button"
          className="btn-toggle-diff"
          onClick={() => setShowBeforeAfter((prev) => !prev)}
        >
          {showBeforeAfter ? 'Hide diff' : 'See before & after'}
        </button>
      </div>

      {/* Expandable Before & After Diff Panel */}
      {showBeforeAfter && (
        <BeforeAfterPanel
          original={original}
          current={text}
          platformName={name}
        />
      )}
    </div>
  );
}
