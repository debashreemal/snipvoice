import React, { useState } from 'react';
import { Instagram, Linkedin, Twitter, Video, Check } from 'lucide-react';
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

  // Small panel state for recording views and likes when marking as posted
  const [isRecordingResults, setIsRecordingResults] = useState(false);
  const [viewsInput, setViewsInput] = useState('54200');
  const [likesInput, setLikesInput] = useState('3800');

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

  const handleConfirmPosted = () => {
    const viewsNum = parseInt(viewsInput, 10) || 0;
    const likesNum = parseInt(likesInput, 10) || 0;
    onMarkPosted(slot.id, { views: viewsNum, likes: likesNum });
    onClose();
  };

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
          "{slot.hookLine}"
        </div>

        {/* Why this slot rationale */}
        <div className="slot-panel-reason-box">
          <span className="slot-panel-reason-label">WHY THIS SLOT</span>
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
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recording Results Sub-Panel */}
        {isRecordingResults ? (
          <div className="slot-record-results-box">
            <div className="record-results-header">
              <span className="record-results-title">Record post results</span>
              <span className="record-results-sub">
                Enters live metrics into your Performance analytics
              </span>
            </div>

            <div className="record-results-grid">
              <div className="record-input-group">
                <label className="record-input-label" htmlFor="metric-views">
                  Views
                </label>
                <input
                  id="metric-views"
                  type="number"
                  min="0"
                  step="100"
                  className="record-metric-input"
                  value={viewsInput}
                  onChange={(e) => setViewsInput(e.target.value)}
                  placeholder="e.g. 54200"
                />
              </div>

              <div className="record-input-group">
                <label className="record-input-label" htmlFor="metric-likes">
                  Likes
                </label>
                <input
                  id="metric-likes"
                  type="number"
                  min="0"
                  step="10"
                  className="record-metric-input"
                  value={likesInput}
                  onChange={(e) => setLikesInput(e.target.value)}
                  placeholder="e.g. 3800"
                />
              </div>
            </div>

            <div className="record-results-actions">
              <button
                type="button"
                className="btn-save-results"
                onClick={handleConfirmPosted}
              >
                Confirm & mark posted
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
              <button
                type="button"
                className="btn-mark-posted"
                onClick={() => setIsRecordingResults(true)}
              >
                Mark as posted
              </button>
            ) : (
              <div className="slot-already-posted-badge">
                <Check size={14} strokeWidth={3} />
                <span>Already posted</span>
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
      </div>
    </div>
  );
}
