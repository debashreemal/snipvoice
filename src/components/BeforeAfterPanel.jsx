import React, { useState } from 'react';
import { Columns, Copy, Check, X, Sparkles, ArrowRight } from 'lucide-react';

// Side-by-side view of Original vs Edited caption with stats and copy
export default function BeforeAfterPanel({
  original = '',
  edited = '',
  current = '',
  platformName = 'Caption',
  onClose,
}) {
  const editedText = edited ?? current ?? '';
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedEdited, setCopiedEdited] = useState(false);

  const origChars = original ? original.length : 0;
  const editedChars = editedText ? editedText.length : 0;
  const charDiff = editedChars - origChars;

  const handleCopy = async (textToCopy, isEdited) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (isEdited) {
        setCopiedEdited(true);
        setTimeout(() => setCopiedEdited(false), 2000);
      } else {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy from diff:', err);
    }
  };

  return (
    <div className="before-after-overlay" onClick={onClose}>
      <div className="before-after-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="before-after-header">
          <div className="before-after-title-group">
            <div className="before-after-icon-badge">
              <Columns size={16} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="before-after-title">
                Before & After Comparison — {platformName}
              </h3>
              <p className="before-after-subtitle">
                Compare the AI baseline with your personalized edits
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="before-after-stats-strip">
          <div className="diff-stat-item">
            <span className="diff-stat-label">ORIGINAL</span>
            <span className="diff-stat-val">{origChars} chars</span>
          </div>
          <ArrowRight size={14} className="diff-arrow-icon" />
          <div className="diff-stat-item">
            <span className="diff-stat-label">CUSTOMIZED</span>
            <span className="diff-stat-val">{editedChars} chars</span>
          </div>
          <div className="diff-stat-delta">
            {charDiff > 0 ? `+${charDiff} chars` : charDiff < 0 ? `${charDiff} chars` : 'Same length'}
          </div>

          <div className="diff-voice-status">
            <Sparkles size={13} strokeWidth={2.2} />
            <span>Edits update your brand tone</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="before-after-grid">
          {/* Original Column */}
          <div className="before-after-col">
            <div className="before-after-col-header">
              <span className="before-after-badge original-badge">Original AI Draft</span>
              <button
                type="button"
                className="btn-copy-diff"
                onClick={() => handleCopy(original, false)}
                disabled={!original}
                title="Copy original caption"
              >
                {copiedOriginal ? <Check size={12} strokeWidth={2.4} /> : <Copy size={12} strokeWidth={2.2} />}
                <span>{copiedOriginal ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="before-after-text-box original-box">
              {original || (
                <span className="diff-empty-text">No original caption available</span>
              )}
            </div>
          </div>

          {/* Edited Column */}
          <div className="before-after-col">
            <div className="before-after-col-header">
              <span className="before-after-badge edited-badge">Your Polished Version</span>
              <button
                type="button"
                className="btn-copy-diff"
                onClick={() => handleCopy(editedText, true)}
                disabled={!editedText}
                title="Copy customized caption"
              >
                {copiedEdited ? <Check size={12} strokeWidth={2.4} /> : <Copy size={12} strokeWidth={2.2} />}
                <span>{copiedEdited ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="before-after-text-box edited-box">
              {editedText ? (
                editedText
              ) : (
                <span className="diff-empty-text">
                  No edits made yet. You can edit the caption on the card and click &ldquo;Save edit&rdquo;.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="before-after-footer">
          <span className="diff-footer-note">
            SnipVoice uses your edits to extract style rules so future drafts match your authentic voice.
          </span>
          <button
            type="button"
            className="btn-diff-done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
