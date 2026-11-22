import React, { useState } from 'react';
import {
  Instagram,
  Linkedin,
  Twitter,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Globe,
  Columns,
} from 'lucide-react';
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
    captionLanguage,
  } = useAppContext();

  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [language, setLanguage] = useState(captionLanguage || 'hinglish');
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

  // 1-Click Copy handler: copies text (edited if edited) to clipboard and shows "Copied" for 1.5s
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy caption:', err);
    }
  };

  // Perform single platform regeneration via /api/captions
  const handleExecuteRegenerate = async (targetLang = language, force = false) => {
    setIsRegenerating(true);
    setShowConfirm(false);

    try {
      const data = await apiFetch('/api/captions', {
        method: 'POST',
        body: {
          clipId,
          platforms: [name],
          language: targetLang,
          forceOverwrite: force,
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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    handleExecuteRegenerate(newLang, true);
  };

  const handleRegenerateClick = () => {
    if (isEdited) {
      // Do not overwrite edited caption without confirmation
      setShowConfirm(true);
    } else {
      handleExecuteRegenerate(language, false);
    }
  };

  return (
    <div className="caption-card">
      {/* Top row: Platform name, icon, language switcher, character count */}
      <div className="caption-card-header">
        <div className="caption-platform-info">
          <span className="caption-platform-icon">{renderIcon()}</span>
          <span className="caption-platform-name">{name}</span>

          {/* In-Card Language Selector */}
          <div className="caption-lang-group" title="Change caption language">
            <Globe size={12} strokeWidth={2.4} />
            <select
              className="caption-lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isParentLoading || isRegenerating}
            >
              <option value="Hinglish">Hinglish</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
            </select>
          </div>
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
        placeholder={`Draft ${name} caption in ${language}...`}
        disabled={isParentLoading || isRegenerating}
      />

      {/* Voice Match Line + Flat Progress Bar */}
      <div className="caption-voice-match-section">
        <div className="caption-voice-match-header">
          <span className="caption-voice-label">Voice match</span>
          <span className="caption-voice-percent">
            {voiceMatch !== null && voiceMatch !== undefined
              ? `${voiceMatch}%`
              : 'Learning your tone'}
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
          <span className="caption-confirm-text">Replace your customized version?</span>
          <div className="caption-confirm-btns">
            <button
              type="button"
              className="btn-confirm-yes"
              onClick={() => handleExecuteRegenerate(language, true)}
              disabled={isRegenerating}
            >
              Yes, rewrite
            </button>
            <button
              type="button"
              className="btn-confirm-no"
              onClick={() => setShowConfirm(false)}
              disabled={isRegenerating}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Row: Primary buttons (Save edit, Copy, Regenerate) + Secondary (See before & after) */}
      <div className="caption-actions-row">
        <div className="caption-primary-actions">
          <button
            type="button"
            className="btn-save-edit"
            onClick={() => saveCaptionEdit(projectId, clipId, platformId)}
            disabled={isParentLoading || isRegenerating}
            title="Save this edit to train your personal style model"
          >
            <Check size={14} strokeWidth={2.4} />
            <span>{isEdited ? 'Update edit' : 'Save edit'}</span>
          </button>

          {/* Dedicated 1-Click Copy Paste Button */}
          <button
            type="button"
            className={`btn-copy-caption ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            disabled={!text}
            title="Ready to copy & paste to social media"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={2.4} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2.2} />
                <span>Copy</span>
              </>
            )}
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

        <div className="caption-secondary-actions">
          {/* Properly styled Before & After Diff Button */}
          <button
            type="button"
            className="btn-toggle-diff"
            onClick={() => setShowBeforeAfter(true)}
            disabled={isParentLoading || isRegenerating}
            title="Compare initial AI draft vs your edits"
          >
            <Columns size={13} strokeWidth={2.2} />
            <span>See before & after</span>
          </button>

          {isEdited && (
            <span className="caption-edited-pill" title="You customized this caption">
              Customized
            </span>
          )}
        </div>
      </div>

      {/* Expandable Before & After Diff Modal */}
      {showBeforeAfter && (
        <BeforeAfterPanel
          original={original}
          edited={text}
          current={text}
          platformName={name}
          onClose={() => setShowBeforeAfter(false)}
        />
      )}
    </div>
  );
}
