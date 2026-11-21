import React from 'react';
import { Plus } from 'lucide-react';
import { WEEK_DAYS } from '../data/mock';
import SlotCard from './SlotCard';

// 7-column week grid for scheduling (Mon to Sun) with interactive day headers and slot counters
export default function WeekGrid({ slots, onSelectSlot, onAddSlotToDay }) {
  return (
    <div className="week-grid-container">
      {WEEK_DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day.key);
        const hasPosts = daySlots.length > 0;

        return (
          <div key={day.key} className={`week-day-column ${hasPosts ? 'has-slots' : 'is-empty'}`}>
            {/* Day Header with day name, date, post count badge, and quick-add button */}
            <div className="week-day-header">
              <div className="week-day-header-main">
                <span className="week-day-name">{day.name}</span>
                <span className="week-day-date">{day.date}</span>
              </div>

              <div className="week-day-header-actions">
                <span className={`week-day-count-badge ${hasPosts ? 'is-active' : ''}`}>
                  {daySlots.length} {daySlots.length === 1 ? 'post' : 'posts'}
                </span>
                {onAddSlotToDay && (
                  <button
                    type="button"
                    className="btn-day-add-slot"
                    onClick={() => onAddSlotToDay(day.key)}
                    title={`Schedule a post for ${day.name} (${day.date})`}
                    aria-label={`Add post to ${day.name}`}
                  >
                    <Plus size={13} strokeWidth={2.8} />
                  </button>
                )}
              </div>
            </div>

            {/* Slots inside this day column */}
            <div className="week-day-slots">
              {daySlots.length === 0 ? (
                <div
                  className="week-day-empty-slot"
                  onClick={() => onAddSlotToDay && onAddSlotToDay(day.key)}
                  title="Click to schedule a post for this day"
                >
                  <span className="empty-day-prompt">+ Schedule</span>
                </div>
              ) : (
                daySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onSelect={onSelectSlot}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
