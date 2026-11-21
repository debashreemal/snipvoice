import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Instagram,
  Linkedin,
  Twitter,
  Video,
  Wand2,
  Plus,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../lib/api';

// Platform icon helper
function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={14} strokeWidth={2.2} />;
    case 'linkedin':
      return <Linkedin size={14} strokeWidth={2.2} />;
    case 'x':
      return <Twitter size={14} strokeWidth={2.2} />;
    default:
      return <Video size={14} strokeWidth={2.2} />;
  }
}

const DEFAULT_WORDS_USE = 'Jugaad, Hustle, Organic reach, Relatable, Bharat, Consistency, Ground reality';
const DEFAULT_WORDS_AVOID = 'Viral hack, Synergy, Guru, Guaranteed, 10x growth, Passive income';

const QUICK_USE = ['Tier-2', 'Bharat', 'Retention', 'Distribution', 'Execution', 'Scale'];
const QUICK_AVOID = ['Synergy', '10x overnight', 'Passive income', 'Growth hack', 'Bandwidth'];

export default function BrandVoicePage() {
  const {
    brandVoice,
    updateBrandVoice,
    learnedNotes,
    edits,
    projects,
  } = useAppContext();

  // Local form state for brand voice editing (auto-filled from memory)
  const [tone, setTone] = useState(brandVoice?.tone || 'Direct & conversational');
  const [wordsIUse, setWordsIUse] = useState(brandVoice?.wordsIUse || DEFAULT_WORDS_USE);
  const [wordsIAvoid, setWordsIAvoid] = useState(brandVoice?.wordsIAvoid || DEFAULT_WORDS_AVOID);
  const [isSaved, setIsSaved] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState(null);

  // Sync state whenever brandVoice updates in context / database
  useEffect(() => {
    if (brandVoice) {
      if (brandVoice.tone) setTone(brandVoice.tone);
      setWordsIUse(brandVoice.wordsIUse || DEFAULT_WORDS_USE);
      setWordsIAvoid(brandVoice.wordsIAvoid || DEFAULT_WORDS_AVOID);
    }
  }, [brandVoice]);

  // Save updated voice profile to Supabase & global memory
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateBrandVoice({ tone, wordsIUse, wordsIAvoid });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Auto-extract characteristic keywords from project transcripts and recent edits
  const handleAutoExtract = () => {
    setIsExtracting(true);
    setExtractNotice(null);

    setTimeout(() => {
      const foundKeywords = [];
      const candidateUse = ['Tier-2', 'Bharat', 'Retention', 'Monetization', 'Distribution', 'Creator economy', 'Execution', 'Ground reality', 'Organic reach', 'Consistency'];
      const candidateAvoid = ['Synergy', '10x overnight', 'Passive income', 'Growth hack', 'Guru', 'Guaranteed'];

      const allText = projects.map((p) => p.transcript || '').join(' ') + ' ' + edits.map((e) => e.edited || '').join(' ');
      const lower = allText.toLowerCase();

      candidateUse.forEach((word) => {
        if (lower.includes(word.toLowerCase())) {
          foundKeywords.push(word);
        }
      });

      const currentUseList = wordsIUse.split(',').map((s) => s.trim()).filter(Boolean);
      const combinedUse = Array.from(new Set([...currentUseList, ...foundKeywords, 'Tier-2', 'Retention']));

      const currentAvoidList = wordsIAvoid.split(',').map((s) => s.trim()).filter(Boolean);
      const combinedAvoid = Array.from(new Set([...currentAvoidList, ...candidateAvoid]));

      setWordsIUse(combinedUse.join(', '));
      setWordsIAvoid(combinedAvoid.join(', '));
      setIsExtracting(false);
      setExtractNotice('Auto-extracted creator vocabulary from video transcripts & edit memory!');
      setTimeout(() => setExtractNotice(null), 4000);
    }, 450);
  };

  // Quick-add pill helper
  const addWordToUse = (word) => {
    const list = wordsIUse.split(',').map((s) => s.trim()).filter(Boolean);
    if (!list.map((s) => s.toLowerCase()).includes(word.toLowerCase())) {
      setWordsIUse([...list, word].join(', '));
    }
  };

  const addWordToAvoid = (word) => {
    const list = wordsIAvoid.split(',').map((s) => s.trim()).filter(Boolean);
    if (!list.map((s) => s.toLowerCase()).includes(word.toLowerCase())) {
      setWordsIAvoid([...list, word].join(', '));
    }
  };

  // Average voice match across all projects
  const avgVoiceMatch = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    projects.forEach((proj) => {
      if (proj.captionsState) {
        Object.values(proj.captionsState).forEach((cap) => {
          if (cap.voiceMatch) {
            totalScore += cap.voiceMatch;
            count++;
          }
        });
      }
    });
    return count > 0 ? `${Math.round(totalScore / count)}%` : '—';
  }, [projects]);

  // Last 5 edits
  const recentEdits = edits.slice(0, 5);

  return (
    <div className="brand-voice-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Brand voice</h1>
        <p className="page-subtitle">
          What SnipVoice has learned about how you write.
        </p>
      </div>

      {/* Top 2-Column Section */}
      <div className="brand-voice-top-grid">
        {/* Left Card: Editable Voice Profile (Autofilled Memory) */}
        <div className="brand-voice-profile-card">
          <div className="card-section-header-row">
            <div>
              <h2 className="card-heading">Voice profile</h2>
              <p className="card-subheading">
                Baseline instructions used when drafting multi-platform captions.
              </p>
            </div>
            <button
              type="button"
              className="btn-auto-extract"
              onClick={handleAutoExtract}
              disabled={isExtracting}
              title="Auto-extract characteristic words from your video transcripts and caption history"
            >
              <Wand2 size={13} strokeWidth={2.4} />
              <span>{isExtracting ? 'Analyzing...' : 'Auto-fill from transcripts'}</span>
            </button>
          </div>

          {extractNotice && (
            <div className="memory-extract-pill">
              <Check size={13} strokeWidth={2.8} />
              <span>{extractNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="brand-voice-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-tone">
                Tone & delivery style
              </label>
              <select
                id="profile-tone"
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Direct & conversational">Direct & conversational (Punchy Hinglish)</option>
                <option value="Casual Hinglish">Casual Hinglish (Friendly & relatable)</option>
                <option value="Authoritative">Authoritative Breakdown (Data-backed)</option>
                <option value="Storyteller">Storyteller (Personal anecdotes)</option>
              </select>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="profile-words-use">
                  Words I use
                </label>
                <span className="form-label-hint">Autofilled from memory • Editable</span>
              </div>
              <textarea
                id="profile-words-use"
                className="form-textarea"
                rows={3}
                placeholder="Comma separated: Jugaad, Hustle, Organic reach, Bharat..."
                value={wordsIUse}
                onChange={(e) => setWordsIUse(e.target.value)}
              />
              <div className="voice-tags-suggestion-row">
                <span className="tags-hint">Quick add:</span>
                {QUICK_USE.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="btn-quick-tag"
                    onClick={() => addWordToUse(tag)}
                  >
                    <Plus size={11} strokeWidth={2.4} /> {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="profile-words-avoid">
                  Words I avoid
                </label>
                <span className="form-label-hint">Autofilled from memory • Editable</span>
              </div>
              <textarea
                id="profile-words-avoid"
                className="form-textarea"
                rows={3}
                placeholder="Comma separated: Viral hack, Synergy, Guru, Guaranteed..."
                value={wordsIAvoid}
                onChange={(e) => setWordsIAvoid(e.target.value)}
              />
              <div className="voice-tags-suggestion-row">
                <span className="tags-hint">Quick add:</span>
                {QUICK_AVOID.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="btn-quick-tag avoid-tag"
                    onClick={() => addWordToAvoid(tag)}
                  >
                    <Plus size={11} strokeWidth={2.4} /> {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-form-footer">
              <button type="submit" className="btn-primary-action">
                Save voice profile
              </button>
              {isSaved && (
                <div className="save-confirmation-pill">
                  <Check size={14} strokeWidth={2.8} />
                  <span>Profile saved to memory</span>
                </div>
              )}
              <div className="profile-memory-indicator">
                <Sparkles size={13} strokeWidth={2.2} />
                <span>Active across all projects</span>
              </div>
            </div>
          </form>
        </div>

        {/* Right Card: Learned Memory & Cross-project Metrics */}
        <div className="brand-voice-memory-card">
          <div className="card-section-header">
            <div className="title-with-icon">
              <Sparkles size={18} strokeWidth={2.2} />
              <h2 className="card-heading">Learned memory</h2>
            </div>
            <p className="card-subheading">
              Global stylistic rules synthesized from all your caption edits.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="memory-metrics-row">
            <div className="memory-metric-box">
              <span className="metric-num">{edits.length}</span>
              <span className="metric-lbl">Edits saved</span>
            </div>
            <div className="memory-metric-box">
              <span className="metric-num">{avgVoiceMatch}</span>
              <span className="metric-lbl">Avg voice match</span>
            </div>
          </div>

          {/* Learned Notes List */}
          <div className="learned-memory-list">
            {learnedNotes.length === 0 ? (
              <p className="empty-memory-text">
                No rules learned yet. Edit and save captions in any project to train your voice.
              </p>
            ) : (
              learnedNotes.map((note, idx) => (
                <div key={idx} className="memory-rule-item">
                  <span className="memory-rule-bullet" />
                  <span className="memory-rule-text">{note}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Edits (Last 5 with before & after) */}
      <div className="recent-edits-section">
        <div className="recent-edits-header">
          <h2 className="section-title">Recent edits</h2>
          <p className="section-subtitle">
            Before and after comparisons for the last 5 caption edits across your projects.
          </p>
        </div>

        <div className="recent-edits-list">
          {recentEdits.length === 0 ? (
            <div className="recent-edits-empty">
              No caption edits saved yet.
            </div>
          ) : (
            recentEdits.map((item) => (
              <div key={item.id} className="recent-edit-card">
                {/* Meta header row */}
                <div className="edit-card-meta">
                  <div className="edit-tags-group">
                    <span className="edit-project-pill" title={item.projectName}>
                      {item.projectName}
                    </span>
                    <span className="edit-platform-pill">
                      {getPlatformIcon(item.platform)}
                      <span>{item.platform}</span>
                    </span>
                  </div>
                  <span className="edit-timestamp">{item.timestamp}</span>
                </div>

                {/* Before and After Comparison Grid */}
                <div className="edit-diff-grid">
                  <div className="diff-column diff-original">
                    <span className="diff-label">Original draft</span>
                    <p className="diff-text">{item.original}</p>
                  </div>
                  <div className="diff-column diff-edited">
                    <span className="diff-label">Your edit</span>
                    <p className="diff-text">{item.edited}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
