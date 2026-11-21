import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { SAMPLE_TRANSCRIPT } from '../data/mock';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../lib/api';

// New Project Page: Ingest transcript and create real project via /api/pick-clips
export default function NewProjectPage() {
  const navigate = useNavigate();
  const { brandVoice, addRealProject } = useAppContext();

  const [projectTitle, setProjectTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [tone, setTone] = useState(brandVoice.tone || 'Direct');
  const [wordsIUse, setWordsIUse] = useState(brandVoice.wordsIUse || '');
  const [wordsIAvoid, setWordsIAvoid] = useState(brandVoice.wordsIAvoid || '');

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load sample transcript into form fields
  const handleLoadSample = () => {
    setProjectTitle('Episode 14: Tier 2 Audiences & The Honest Creator Economy');
    setTranscript(SAMPLE_TRANSCRIPT);
    setTone('Direct');
    setWordsIUse('Jugaad, Hustle, Organic reach, Consistency');
    setWordsIAvoid('Viral hack, Synergy, Guru, Guaranteed');
    setErrorMessage(null);
  };

  // Execute pick-clips API call and store returned project with database IDs
  const executePickClips = async (titleToUse, transcriptToUse) => {
    const cleanTitle = (titleToUse || '').trim();
    const cleanTranscript = (transcriptToUse || '').trim();

    if (!cleanTitle) {
      setErrorMessage('Please enter a project title.');
      return;
    }
    if (!cleanTranscript) {
      setErrorMessage('Please paste a transcript with timestamps.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiFetch('/api/pick-clips', {
        method: 'POST',
        body: {
          title: cleanTitle,
          transcript: cleanTranscript,
        },
      });

      if (!data || !data.project || !data.clips) {
        throw new Error('Could not pick clips. Check your transcript and try again.');
      }

      // Add project and database-persisted clips into shared store
      const newProj = addRealProject({
        project: data.project,
        clips: data.clips,
      });

      navigate(`/projects/${newProj.id}/clips`);
    } catch (err) {
      console.error('Pick clips error:', err);
      setErrorMessage(
        err.message || 'Could not pick clips. Check your transcript and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Immediate sample run using the real API route
  const handleTryWithSample = () => {
    const sampleTitle = 'Episode 14: Tier 2 Audiences & The Honest Creator Economy';
    setProjectTitle(sampleTitle);
    setTranscript(SAMPLE_TRANSCRIPT);
    setTone('Direct');
    setWordsIUse('Jugaad, Hustle, Organic reach, Consistency');
    setWordsIAvoid('Viral hack, Synergy, Guru, Guaranteed');
    executePickClips(sampleTitle, SAMPLE_TRANSCRIPT);
  };

  const handleFindClips = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const title = projectTitle.trim() || 'Untitled Project';
    const transcriptToUse = transcript.trim();
    executePickClips(title, transcriptToUse);
  };

  return (
    <div className="upload-page">
      {/* Back button */}
      <div className="workspace-top-bar" style={{ marginBottom: '14px' }}>
        <Link to="/projects" className="workspace-back-btn">
          <ArrowLeft size={16} strokeWidth={2.4} />
          <span>Projects</span>
        </Link>
      </div>

      {/* Row of 3 steps on flat cards */}
      <div className="upload-steps-row">
        <div className="upload-step-card">
          1  Paste a transcript
        </div>
        <div className="upload-step-card">
          2  Approve the clips you like
        </div>
        <div className="upload-step-card">
          3  Edit captions. SnipVoice learns
        </div>
      </div>

      {/* Page Header with Try with sample button */}
      <div className="page-header upload-header-flex">
        <div>
          <h1 className="page-title">New project</h1>
          <p className="page-subtitle">
            Paste a transcript. SnipVoice picks the best moments.
          </p>
        </div>
        <button
          type="button"
          className="btn-try-sample"
          onClick={handleTryWithSample}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Try with sample'}
        </button>
      </div>

      <form onSubmit={handleFindClips} className="upload-form">
        {/* Project Title Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="project-title">
            Project title
          </label>
          <input
            id="project-title"
            type="text"
            className="form-input"
            placeholder="e.g. Scaling an Indian D2C Brand from Zero"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Transcript Area */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" htmlFor="transcript-area">
              Transcript with timestamps
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLoadSample}
              disabled={isLoading}
            >
              Load sample transcript
            </button>
          </div>
          <textarea
            id="transcript-area"
            className="form-textarea form-textarea-compact"
            placeholder="Paste your video transcript here with timestamps in format [00:01:23] text here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
            disabled={isLoading}
          />
        </div>

        {/* Brand Voice Settings (pre-filled from global brand voice) */}
        <div className="brand-voice-box">
          <div className="brand-voice-header">
            <Sparkles size={16} strokeWidth={2.2} />
            <span className="brand-voice-title">Brand voice settings</span>
            <span className="brand-voice-note">(Pre-filled from your global profile)</span>
          </div>

          <div className="brand-voice-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="tone-select">
                Tone
              </label>
              <select
                id="tone-select"
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isLoading}
              >
                <option value="Direct">Direct & Punchy</option>
                <option value="Casual">Casual Hinglish</option>
                <option value="Authoritative">Authoritative Breakdown</option>
                <option value="Storyteller">Storyteller</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="words-use">
                Words I use
              </label>
              <input
                id="words-use"
                type="text"
                className="form-input"
                placeholder="e.g. Jugaad, Hustle, Organic reach"
                value={wordsIUse}
                onChange={(e) => setWordsIUse(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="words-avoid">
                Words I avoid
              </label>
              <input
                id="words-avoid"
                type="text"
                className="form-input"
                placeholder="e.g. Viral hack, Synergy, Guru"
                value={wordsIAvoid}
                onChange={(e) => setWordsIAvoid(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} strokeWidth={2.4} className="spin-icon" />
                <span>Finding your best moments...</span>
              </>
            ) : (
              <>
                <span>Find best clips</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </>
            )}
          </button>
        </div>

        {/* Error message under the button with Try again */}
        {errorMessage && (
          <div className="upload-error-box">
            <div className="upload-error-left">
              <AlertCircle size={18} strokeWidth={2.4} />
              <span className="upload-error-text">{errorMessage}</span>
            </div>
            <button
              type="button"
              className="btn-try-again"
              onClick={handleFindClips}
              disabled={isLoading}
            >
              Try again
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
