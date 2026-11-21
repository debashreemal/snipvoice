import React from 'react';
import { WEEK_DAYS } from '../data/mock';
import SlotCard from './SlotCard';

// 7-column week grid for scheduling (Mon to Sun)
export default function WeekGrid({ slots, onSelectSlot }) {
  return (
    <div className="week-grid-container">
      {WEEK_DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day.key);

        return (
          <div key={day.key} className="week-day-column">
            {/* Day Header with day name and date on --day-column background */}
            <div className="week-day-header">
              <span className="week-day-name">{day.name}</span>
              <span className="week-day-date">{day.date}</span>
            </div>

            {/* Slots inside this day column */}
            <div className="week-day-slots">
              {daySlots.length === 0 ? (
                <div className="week-day-empty-slot">
                  No posts
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
