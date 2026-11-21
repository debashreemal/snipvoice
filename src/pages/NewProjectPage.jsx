import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  UploadCloud,
  FileAudio,
  FileVideo,
  X,
  Info,
} from 'lucide-react';
import { SAMPLE_TRANSCRIPT } from '../data/mock';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../lib/api';

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.webm', '.aac', '.ogg', '.flac'];

// New Project Page: Ingest transcript or upload media file
export default function NewProjectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { brandVoice, addRealProject } = useAppContext();

  // Shared project state
  const [projectTitle, setProjectTitle] = useState('');
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'file'

  const DEFAULT_USE = 'Jugaad, Hustle, Organic reach, Relatable, Bharat, Consistency';
  const DEFAULT_AVOID = 'Viral hack, Synergy, Guru, Guaranteed, 10x growth';

  // Transcript tab state
  const [transcript, setTranscript] = useState('');
  const [tone, setTone] = useState(brandVoice.tone || 'Direct');
  const [wordsIUse, setWordsIUse] = useState(brandVoice.wordsIUse || DEFAULT_USE);
  const [wordsIAvoid, setWordsIAvoid] = useState(brandVoice.wordsIAvoid || DEFAULT_AVOID);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (brandVoice) {
      if (brandVoice.tone) setTone(brandVoice.tone);
      if (brandVoice.wordsIUse) setWordsIUse(brandVoice.wordsIUse);
      if (brandVoice.wordsIAvoid) setWordsIAvoid(brandVoice.wordsIAvoid);
    }
  }, [brandVoice]);

  // Upload file tab state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [language, setLanguage] = useState('English (India)');
  const [uploadNotice, setUploadNotice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStepText, setUploadStepText] = useState('Transcribing with Gnani AI...');

  // Load sample transcript into form fields
  const handleLoadSample = () => {
    setProjectTitle('Episode 14: Tier 2 Audiences & The Honest Creator Economy');
    setTranscript(SAMPLE_TRANSCRIPT);
    setTone('Direct');
    setWordsIUse('Jugaad, Hustle, Organic reach, Consistency');
    setWordsIAvoid('Viral hack, Synergy, Guru, Guaranteed');
    setErrorMessage(null);
  };

  // Validate and store selected media file
  const validateAndSetFile = (file) => {
    setFileError(null);
    setUploadNotice(null);

    if (!file) return;

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Unsupported file type. Please choose .mp3, .wav, .m4a, .mp4, .mov, or .webm.');
      setSelectedFile(null);
      return;
    }

    // Validate size (max 200 MB)
    if (file.size > 200 * 1024 * 1024) {
      setFileError('File is larger than 200 MB. Please choose a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Transcribe button action for Upload file tab (calls Gnani.ai STT)
  const handleTranscribeClick = async (e) => {
    e.preventDefault();
    if (!selectedFile || isUploading || isLoading) return;

    let titleToUse = (projectTitle || '').trim();
    if (!titleToUse) {
      const cleanFileName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      titleToUse = cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1);
      setProjectTitle(titleToUse);
    }

    setIsUploading(true);
    setUploadStepText('Transcribing audio with Gnani AI & Groq Whisper...');
    setFileError(null);
    setUploadNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);

      const transData = await apiFetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transData || !transData.transcript) {
        throw new Error('No transcript received from speech engine. Please try again.');
      }

      setUploadStepText(`Transcribed via ${transData.provider || 'AI'}! Finding best moments...`);
      await executePickClips(titleToUse, transData.transcript);
    } catch (err) {
      console.error('Transcription error:', err);
      setFileError(err.message || 'Could not transcribe file. Check your file and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Execute pick-clips API call for transcript tab
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

  const handleTryWithSample = () => {
    setActiveTab('transcript');
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
            Paste a transcript or upload a file. SnipVoice picks the best moments.
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

      <form onSubmit={activeTab === 'transcript' ? handleFindClips : handleTranscribeClick} className="upload-form">
        {/* Project Title Input (Shared by both tabs) */}
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

        {/* Two Tabs at Top of Input Area */}
        <div className="upload-input-tabs">
          <button
            type="button"
            className={`upload-tab-btn ${activeTab === 'transcript' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('transcript');
              setErrorMessage(null);
            }}
          >
            <FileText size={16} strokeWidth={2.2} />
            <span>Paste transcript</span>
          </button>

          <button
            type="button"
            className={`upload-tab-btn ${activeTab === 'file' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('file');
              setFileError(null);
              setUploadNotice(null);
            }}
          >
            <UploadCloud size={16} strokeWidth={2.2} />
            <span>Upload file</span>
          </button>
        </div>

        {/* TAB 1: PASTE TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <>
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

            {/* Brand Voice Settings */}
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

            {/* Error message */}
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
          </>
        )}

        {/* TAB 2: UPLOAD FILE */}
        {activeTab === 'file' && (
          <>
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mov,.webm"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Drop zone or selected file card */}
            {!selectedFile ? (
              <div
                className={`file-dropzone ${isDragOver ? 'is-dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon">
                  <UploadCloud size={24} strokeWidth={2.2} />
                </div>
                <span className="dropzone-text">
                  Drag and drop your audio or video file here, or
                </span>
                <button
                  type="button"
                  className="btn-choose-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose file
                </button>
                <span className="dropzone-hint">
                  Supports MP3, WAV, M4A, AAC, OGG, MP4, WEBM (up to 200 MB)
                </span>
              </div>
            ) : (
              <div className="file-selected-card">
                <div className="file-selected-left">
                  <div className="file-selected-icon">
                    {selectedFile.type.includes('video') || selectedFile.name.match(/\.(mp4|mov|webm)$/i) ? (
                      <FileVideo size={18} strokeWidth={2.2} />
                    ) : (
                      <FileAudio size={18} strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="file-selected-details">
                    <span className="file-selected-name">{selectedFile.name}</span>
                    <span className="file-selected-size">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={handleRemoveFile}
                >
                  <X size={14} strokeWidth={2.4} />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {/* File Error Line */}
            {fileError && (
              <div className="upload-error-box" style={{ marginTop: '12px' }}>
                <div className="upload-error-left">
                  <AlertCircle size={18} strokeWidth={2.4} />
                  <span className="upload-error-text">{fileError}</span>
                </div>
              </div>
            )}

            {/* Language Select */}
            <div className="form-group" style={{ marginTop: '18px' }}>
              <label className="form-label" htmlFor="file-language">
                Language
              </label>
              <select
                id="file-language"
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English (India)">English (India)</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            {/* Brand Voice Settings for Upload */}
            <div className="brand-voice-box">
              <div className="brand-voice-header">
                <Sparkles size={16} strokeWidth={2.2} />
                <span className="brand-voice-title">Brand voice settings</span>
                <span className="brand-voice-note">(Pre-filled from your global profile)</span>
              </div>

              <div className="brand-voice-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="tone-select-file">
                    Tone
                  </label>
                  <select
                    id="tone-select-file"
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
                  <label className="form-label" htmlFor="words-use-file">
                    Words I use
                  </label>
                  <input
                    id="words-use-file"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jugaad, Hustle, Organic reach"
                    value={wordsIUse}
                    onChange={(e) => setWordsIUse(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="words-avoid-file">
                    Words I avoid
                  </label>
                  <input
                    id="words-avoid-file"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Viral hack, Synergy, Guru"
                    value={wordsIAvoid}
                    onChange={(e) => setWordsIAvoid(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action button for Upload file tab */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={!selectedFile || Boolean(fileError) || isUploading || isLoading}
              >
                {isUploading || isLoading ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.4} className="spin-icon" />
                    <span>{uploadStepText}</span>
                  </>
                ) : (
                  <>
                    <span>Transcribe audio & find clips</span>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
