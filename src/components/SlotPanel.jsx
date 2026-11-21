import React, { useState } from 'react';
import { Instagram, Linkedin, Twitter, Video, Check, BarChart2, Sparkles } from 'lucide-react';
import { WEEK_DAYS } from '../data/mock';

function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={16} strokeWidth={2.2} />;
    case 'linkedin':
      return <Linkedin size={16} strokeWidth={2.2} />;
    case 'x':
      return <Twitter size={16} strokeWidth={2.2} />;
    case 'youtube':
    default:
      return <Video size={16} strokeWidth={2.2} />;
  }
}

const TIME_OPTIONS = [
  '9:00 AM',
  '11:00 AM',
  '12:30 PM',
  '2:00 PM',
  '4:30 PM',
  '6:00 PM',
  '7:00 PM',
  '8:30 PM'
];

// Detail panel for a clicked calendar slot with post-performance recording
export default function SlotPanel({ slot, onClose, onUpdate, onRemove, onMarkPosted }) {
  const [selectedDay, setSelectedDay] = useState(slot.day);
  const [selectedTime, setSelectedTime] = useState(slot.time);

  // Results panel for logging 24h metrics after post has had time to perform
  const [isRecordingResults, setIsRecordingResults] = useState(false);
  const [viewsInput, setViewsInput] = useState(slot.views ? String(slot.views) : '');
  const [likesInput, setLikesInput] = useState(slot.likes ? String(slot.likes) : '');
  const [metricsSavedNotice, setMetricsSavedNotice] = useState(false);

  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setSelectedDay(newDay);
    onUpdate(slot.id, { day: newDay });
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    onUpdate(slot.id, { time: newTime });
  };

  // 1-Click: Mark as published now (clean logic: post is live, starting at 0 views / 0 likes)
  const handleDirectMarkPosted = () => {
    onMarkPosted(slot.id, { views: 0, likes: 0 });
  };

  // Save actual 24h metrics entered by the creator later
  const handleSaveMetrics = () => {
    const viewsNum = parseInt(viewsInput, 10) || 0;
    const likesNum = parseInt(likesInput, 10) || 0;
    onMarkPosted(slot.id, { views: viewsNum, likes: likesNum });
    setIsRecordingResults(false);
    setMetricsSavedNotice(true);
    setTimeout(() => setMetricsSavedNotice(false), 2500);
  };

  const hasMetrics = slot.views > 0 || slot.likes > 0;

  return (
    <div className="slot-panel-overlay" onClick={onClose}>
      <div className="slot-panel-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="slot-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="slot-panel-platform-badge">
              {getPlatformIcon(slot.platform)}
              <span>{slot.platformName}</span>
            </div>
            {slot.projectName && (
              <span className="slot-project-pill">{slot.projectName}</span>
            )}
            {slot.isPosted && (
              <span className="slot-live-pill">
                <Check size={12} strokeWidth={2.8} /> Live
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn-slot-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Full Hook Line */}
        <div className="slot-panel-hook">
          &ldquo;{slot.hookLine}&rdquo;
        </div>

        {/* Why this clip was selected */}
        {slot.clipReason && (
          <div className="slot-panel-reason-box" style={{ marginBottom: '10px' }}>
            <span className="slot-panel-reason-label">WHY THIS CLIP WAS PICKED</span>
            <p className="slot-panel-reason-text">{slot.clipReason}</p>
          </div>
        )}

        {/* Why this slot rationale */}
        <div className="slot-panel-reason-box">
          <span className="slot-panel-reason-label">WHY THIS TIME SLOT</span>
          <p className="slot-panel-reason-text">{slot.reason}</p>
        </div>

        {/* Dropdowns for Day and Time */}
        <div className="slot-panel-dropdowns">
          <div className="slot-dropdown-group">
            <label className="slot-dropdown-label" htmlFor="slot-day-select">
              Day
            </label>
            <select
              id="slot-day-select"
              className="slot-select"
              value={selectedDay}
              onChange={handleDayChange}
              disabled={slot.isPosted}
            >
              {WEEK_DAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name} ({d.date})
                </option>
              ))}
            </select>
          </div>

          <div className="slot-dropdown-group">
            <label className="slot-dropdown-label" htmlFor="slot-time-select">
              Time
            </label>
            <select
              id="slot-time-select"
              className="slot-select"
              value={selectedTime}
              onChange={handleTimeChange}
              disabled={slot.isPosted}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log 24h Results Sub-Panel (Only when requested to record actual performance) */}
        {isRecordingResults ? (
          <div className="slot-record-results-box">
            <div className="record-results-header">
              <span className="record-results-title">Log 24h performance metrics</span>
              <span className="record-results-sub">
                Enter your real reach after 24-48 hours to train SnipVoice&apos;s hook insights
              </span>
            </div>

            <div className="record-results-grid">
              <div className="record-input-group">
                <label className="record-input-label" htmlFor="metric-views">
                  Actual Views (after 24h)
                </label>
                <input
                  id="metric-views"
                  type="number"
                  min="0"
                  step="50"
                  className="record-metric-input"
                  value={viewsInput}
                  onChange={(e) => setViewsInput(e.target.value)}
                  placeholder="e.g. 1450"
                />
              </div>

              <div className="record-input-group">
                <label className="record-input-label" htmlFor="metric-likes">
                  Actual Likes
                </label>
                <input
                  id="metric-likes"
                  type="number"
                  min="0"
                  step="10"
                  className="record-metric-input"
                  value={likesInput}
                  onChange={(e) => setLikesInput(e.target.value)}
                  placeholder="e.g. 95"
                />
              </div>
            </div>

            <div className="record-results-actions">
              <button
                type="button"
                className="btn-save-results"
                onClick={handleSaveMetrics}
              >
                Save metrics
              </button>
              <button
                type="button"
                className="btn-cancel-results"
                onClick={() => setIsRecordingResults(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Normal Action Buttons */
          <div className="slot-panel-actions">
            {!slot.isPosted ? (
              <>
                <button
                  type="button"
                  className="btn-mark-posted"
                  onClick={handleDirectMarkPosted}
                  title="Mark this post as published on your social feed"
                >
                  <Check size={14} strokeWidth={2.4} />
                  <span>Mark as published</span>
                </button>

                <button
                  type="button"
                  className="btn-retro-metrics"
                  onClick={() => setIsRecordingResults(true)}
                  title="Logging an older post that already has reach data?"
                >
                  Log past results
                </button>
              </>
            ) : (
              <div className="slot-posted-group">
                <div className="slot-already-posted-badge">
                  <Check size={14} strokeWidth={2.8} />
                  <span>Published & Live</span>
                </div>

                <button
                  type="button"
                  className="btn-update-metrics"
                  onClick={() => setIsRecordingResults(true)}
                  title="Enter real views & likes after 24-48 hours"
                >
                  <BarChart2 size={13} strokeWidth={2.2} />
                  <span>{hasMetrics ? `Metrics: ${slot.views} views • ${slot.likes} likes` : 'Log 24h results'}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn-remove-slot"
              onClick={() => {
                onRemove(slot.id);
                onClose();
              }}
            >
              Remove
            </button>
          </div>
        )}

        {metricsSavedNotice && (
          <div className="slot-metrics-success-pill">
            <Check size={13} strokeWidth={2.8} />
            <span>24h metrics logged to Performance analytics!</span>
          </div>
        )}
      </div>
    </div>
  );
}
