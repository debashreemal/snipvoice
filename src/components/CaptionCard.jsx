import React, { useState } from 'react';
import { Instagram, Linkedin, Twitter, RefreshCw, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import BeforeAfterPanel from './BeforeAfterPanel';
import { apiFetch } from '../lib/api';

// Individual caption card per platform for a specific project
export default function CaptionCard({ clipId, platform, projectId, isParentLoading }) {
  const { id: platformId, name, maxChars } = platform;
  const {
    getCaptionData,
    updateCaptionText,
    saveCaptionEdit,
    updateSingleCaption,
  } = useAppContext();

  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Perform single platform regeneration via /api/captions
  const handleExecuteRegenerate = async () => {
    setIsRegenerating(true);
    setShowConfirm(false);

    try {
      const data = await apiFetch('/api/captions', {
        method: 'POST',
        body: {
          clipId,
          platforms: [name],
        },
      });

      if (data && Array.isArray(data.captions) && data.captions.length > 0) {
        const item = data.captions[0];
        updateSingleCaption(
          projectId,
          clipId,
          platformId,
          item.text,
          item.voice_match,
          item.id
        );
      }
    } catch (err) {
      console.error('Failed to regenerate caption:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateClick = () => {
    if (isEdited) {
      // Do not overwrite edited caption without confirmation
      setShowConfirm(true);
    } else {
      handleExecuteRegenerate();
    }
  };

  return (
    <div className="caption-card">
      {/* Top row: Platform name, icon, character count */}
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
        disabled={isParentLoading || isRegenerating}
      />

      {/* Voice Match Line + Flat Progress Bar */}
      <div className="caption-voice-match-section">
        <div className="caption-voice-match-header">
          <span className="caption-voice-label">Voice match</span>
          <span className="caption-voice-percent">
            {voiceMatch !== null && voiceMatch !== undefined
              ? `${voiceMatch}%`
              : 'No style learned yet'}
          </span>
        </div>
        {voiceMatch !== null && voiceMatch !== undefined && (
          <div className="caption-voice-track">
            <div
              className="caption-voice-bar"
              style={{ width: `${Math.min(100, voiceMatch)}%` }}
            />
          </div>
        )}
      </div>

      {/* Inline confirmation when regenerating an edited caption */}
      {showConfirm && (
        <div className="caption-confirm-overwrite">
          <span className="caption-confirm-text">Replace your edited version?</span>
          <div className="caption-confirm-btns">
            <button
              type="button"
              className="btn-confirm-yes"
              onClick={handleExecuteRegenerate}
              disabled={isRegenerating}
            >
              Yes
            </button>
            <button
              type="button"
              className="btn-confirm-no"
              onClick={() => setShowConfirm(false)}
              disabled={isRegenerating}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Row: Save edit, Regenerate, See before & after */}
      <div className="caption-actions-row">
        <div className="caption-primary-actions">
          <button
            type="button"
            className="btn-save-edit"
            onClick={() => saveCaptionEdit(projectId, clipId, platformId)}
            disabled={isParentLoading || isRegenerating}
          >
            {isEdited ? 'Update edit' : 'Save edit'}
          </button>

          <button
            type="button"
            className="btn-regenerate"
            onClick={handleRegenerateClick}
            disabled={isParentLoading || isRegenerating}
            title="Regenerate caption with your learned style"
          >
            {isRegenerating ? (
              <>
                <Loader2 size={14} strokeWidth={2.4} className="spin-icon" />
                <span>Writing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} strokeWidth={2.2} />
                <span>Regenerate</span>
              </>
            )}
          </button>
        </div>

        {/* See before & after button */}
        <button
          type="button"
          className="btn-toggle-diff"
          onClick={() => setShowBeforeAfter((prev) => !prev)}
          disabled={isParentLoading || isRegenerating}
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
