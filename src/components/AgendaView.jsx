import React from 'react';
import { Calendar, Clock, Instagram, Linkedin, Twitter, Video, Check, Plus } from 'lucide-react';
import { WEEK_DAYS } from '../data/mock';

function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={14} strokeWidth={2.4} />;
    case 'linkedin':
      return <Linkedin size={14} strokeWidth={2.4} />;
    case 'x':
      return <Twitter size={14} strokeWidth={2.4} />;
    case 'youtube':
    default:
      return <Video size={14} strokeWidth={2.4} />;
  }
}

export default function AgendaView({ slots, onSelectSlot, onAddSlotToDay }) {
  // Group slots by day
  const daysWithSlots = WEEK_DAYS.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.day === day.key)
  }));

  const totalSlots = slots.length;

  if (totalSlots === 0) {
    return (
      <div className="agenda-empty-container">
        <Calendar size={32} strokeWidth={1.8} className="agenda-empty-icon" />
        <h3 className="agenda-empty-title">No scheduled posts yet</h3>
        <p className="agenda-empty-subtitle">
          Click &ldquo;Auto-plan my week&rdquo; or click &ldquo;+ Schedule post&rdquo; to fill your schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="agenda-view-container">
      {daysWithSlots.map((dayGroup) => {
        const { key, name, date, slots: daySlots } = dayGroup;

        return (
          <div key={key} className="agenda-day-group">
            {/* Day Header Row */}
            <div className="agenda-day-header">
              <div className="agenda-day-left">
                <span className="agenda-day-name">{name}</span>
                <span className="agenda-day-date">{date}</span>
                <span className="agenda-day-count">
                  {daySlots.length} {daySlots.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <button
                type="button"
                className="btn-agenda-add-slot"
                onClick={() => onAddSlotToDay(key)}
                title={`Add post to ${name}`}
              >
                <Plus size={13} strokeWidth={2.8} />
                <span>Add post</span>
              </button>
            </div>

            {/* List of slots in this day */}
            <div className="agenda-slots-list">
              {daySlots.length === 0 ? (
                <div
                  className="agenda-slot-empty"
                  onClick={() => onAddSlotToDay(key)}
                >
                  <span>No posts scheduled for this day. Click to schedule.</span>
                </div>
              ) : (
                daySlots.map((slot) => {
                  const strategicReason = slot.changed_because || slot.reason || slot.clipReason || 'Optimal publishing window';

                  return (
                    <div
                      key={slot.id}
                      className={`agenda-slot-row ${slot.isPosted ? 'is-posted' : ''}`}
                      onClick={() => onSelectSlot(slot)}
                    >
                      {/* Time Column */}
                      <div className="agenda-slot-time-col">
                        <Clock size={13} strokeWidth={2.4} />
                        <span className="agenda-slot-time">{slot.time}</span>
                      </div>

                      {/* Platform Pill */}
                      <div className={`agenda-platform-pill platform-${slot.platform}`}>
                        {getPlatformIcon(slot.platform)}
                        <span>{slot.platformName}</span>
                      </div>

                      {/* Hook Type Pill */}
                      <span className="agenda-hook-type-pill">
                        {slot.hookType || 'Bold claim'}
                      </span>

                      {/* Content Hook */}
                      <div className="agenda-slot-content">
                        <span className="agenda-slot-hook">&ldquo;{slot.hookLine}&rdquo;</span>
                        <span className="agenda-slot-reason">{strategicReason}</span>
                      </div>

                      {/* Status & Changed Tag */}
                      <div className="agenda-slot-status">
                        {slot.changed_because && (
                          <span className="slot-changed-tag" title={slot.changed_because}>
                            Changed
                          </span>
                        )}
                        {slot.isPosted ? (
                          <span className="status-posted-pill">
                            <Check size={12} strokeWidth={3} />
                            Posted
                          </span>
                        ) : (
                          <span className="status-scheduled-pill">Scheduled</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
