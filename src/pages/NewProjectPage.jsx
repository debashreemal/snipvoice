import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLE_TRANSCRIPT } from '../data/mock';
import { useAppContext } from '../context/AppContext';

// New Project Page: Ingest transcript and create project in store
export default function NewProjectPage() {
  const navigate = useNavigate();
  const { brandVoice, createProject } = useAppContext();

  const [projectTitle, setProjectTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [tone, setTone] = useState(brandVoice.tone || 'Direct');
  const [wordsIUse, setWordsIUse] = useState(brandVoice.wordsIUse || '');
  const [wordsIAvoid, setWordsIAvoid] = useState(brandVoice.wordsIAvoid || '');

  // Load sample transcript into form fields
  const handleLoadSample = () => {
    setProjectTitle('Episode 14: Tier 2 Audiences & The Honest Creator Economy');
    setTranscript(SAMPLE_TRANSCRIPT);
    setTone('Direct');
    setWordsIUse('Jugaad, Hustle, Organic reach, Consistency');
    setWordsIAvoid('Viral hack, Synergy, Guru, Guaranteed');
  };

  // Immediate sample run
  const handleTryWithSample = () => {
    const sampleTitle = 'Episode 14: Tier 2 Audiences & The Honest Creator Economy';
    const newProj = createProject({
      title: sampleTitle,
      transcript: SAMPLE_TRANSCRIPT
    });
    navigate(`/projects/${newProj.id}/clips`);
  };

  const handleFindClips = (e) => {
    e.preventDefault();
    const title = projectTitle.trim() || 'Untitled Project';
    const newProj = createProject({
      title,
      transcript: transcript || SAMPLE_TRANSCRIPT
    });
    navigate(`/projects/${newProj.id}/clips`);
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
        >
          Try with sample
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
              />
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <span>Find best clips</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </div>
  );
}
