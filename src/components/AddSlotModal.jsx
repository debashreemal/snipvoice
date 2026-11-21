import React, { useState } from 'react';
import { X, Calendar, Clock, Instagram, Linkedin, Twitter, Video } from 'lucide-react';
import { WEEK_DAYS, PLATFORM_SCHEDULE_CONFIG, MOCK_CLIPS_D2C } from '../data/mock';

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

const PLATFORM_LIST = [
  { key: 'instagram', name: 'Instagram', icon: Instagram },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { key: 'x', name: 'X / Twitter', icon: Twitter },
  { key: 'youtube', name: 'YouTube Shorts', icon: Video }
];

export default function AddSlotModal({ initialDay, projects, onClose, onAddSlot }) {
  const [selectedDay, setSelectedDay] = useState(initialDay || 'mon');
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 'proj-1');

  // Candidate clips to choose from
  const activeProj = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const candidateClips = activeProj?.clips && activeProj.clips.length > 0
    ? activeProj.clips
    : MOCK_CLIPS_D2C;

  const [selectedClipId, setSelectedClipId] = useState(candidateClips[0]?.id || 'clip-1');
  const [customHook, setCustomHook] = useState('');

  const activeClip = candidateClips.find((c) => c.id === selectedClipId) || candidateClips[0];

  const handlePlatformChange = (platKey) => {
    setSelectedPlatform(platKey);
    const config = PLATFORM_SCHEDULE_CONFIG[platKey];
    if (config?.defaultTime) {
      setSelectedTime(config.defaultTime);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dayObj = WEEK_DAYS.find((w) => w.key === selectedDay);
    const config = PLATFORM_SCHEDULE_CONFIG[selectedPlatform] || {};
    const hookText = customHook.trim() || activeClip?.hookLine || 'High retention clip hook';
    const hookType = activeClip?.hookType || activeClip?.hook_type || 'Bold claim';
    const clipReason = activeClip?.reason || 'Key takeaway for target audience.';

    const newSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId: activeProj?.id || 'proj-1',
      projectName: activeProj?.title || 'Project',
      clipId: activeClip?.id || 'clip-manual',
      hookLine: hookText,
      hookType,
      clipReason,
      platform: selectedPlatform,
      platformName: config.name || selectedPlatform,
      time: selectedTime,
      day: selectedDay,
      date: dayObj ? dayObj.date : '',
      dayNumber: dayObj ? dayObj.dayNumber : 23,
      reason: config.reason || 'Optimal platform publishing window',
      isPosted: false,
      plannedWithInsights: false
    };

    onAddSlot(newSlot);
    onClose();
  };

  return (
    <div className="slot-panel-overlay" onClick={onClose}>
      <div className="add-slot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-slot-header">
          <div className="add-slot-title-group">
            <Calendar size={18} strokeWidth={2.4} />
            <h3 className="add-slot-title">Schedule post</h3>
          </div>
          <button type="button" className="btn-slot-close" onClick={onClose}>
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-slot-form">
          {/* Day & Time Selection */}
          <div className="add-slot-row">
            <div className="add-slot-field">
              <label className="form-label" htmlFor="add-slot-day">
                Day of week
              </label>
              <select
                id="add-slot-day"
                className="form-select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name} ({d.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="add-slot-field">
              <label className="form-label" htmlFor="add-slot-time">
                Publish time
              </label>
              <select
                id="add-slot-time"
                className="form-select"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform Buttons */}
          <div className="add-slot-field">
            <label className="form-label">Platform</label>
            <div className="platform-select-pills">
              {PLATFORM_LIST.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlatform === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    className={`platform-pick-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handlePlatformChange(p.key)}
                  >
                    <Icon size={14} strokeWidth={2.4} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project & Clip Picker */}
          {projects.length > 1 && (
            <div className="add-slot-field">
              <label className="form-label" htmlFor="add-slot-project">
                From project
              </label>
              <select
                id="add-slot-project"
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="add-slot-field">
            <label className="form-label" htmlFor="add-slot-clip">
              Choose clip
            </label>
            <select
              id="add-slot-clip"
              className="form-select"
              value={selectedClipId}
              onChange={(e) => setSelectedClipId(e.target.value)}
            >
              {candidateClips.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.timeRange || 'Clip'}] {c.hookLine?.substring(0, 60)}...
                </option>
              ))}
            </select>
          </div>

          {/* Clip preview box */}
          {activeClip && (
            <div className="add-slot-preview-box">
              <span className="add-slot-preview-label">SELECTED CLIP HOOK:</span>
              <p className="add-slot-preview-text">&ldquo;{activeClip.hookLine}&rdquo;</p>
              {activeClip.reason && (
                <p className="add-slot-preview-reason">{activeClip.reason}</p>
              )}
            </div>
          )}

          <div className="add-slot-actions">
            <button type="button" className="btn-secondary-pill" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Add to calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
