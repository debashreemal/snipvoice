import React from 'react';
import { useAppContext } from '../context/AppContext';

// Dark mini calendar card with dates and accent dots for scheduled posts
export default function MiniCalendar() {
  const { scheduledSlots } = useAppContext();

  const monthName = 'November 2026';
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Starting day index for November 1, 2026 (Sunday -> index 6 in Mon-Sun week)
  const emptyDaysPrefix = 6;
  const daysInMonth = 30;
  const todayDate = 21; // Today's date

  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Set of dates that have at least one scheduled post
  const scheduledDays = new Set(scheduledSlots.map((s) => s.dayNumber));

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <span className="calendar-month-title">{monthName}</span>
      </div>

      <div className="calendar-grid">
        {weekdays.map((day, idx) => (
          <div key={`weekday-${idx}`} className="calendar-weekday">
            {day}
          </div>
        ))}

        {Array.from({ length: emptyDaysPrefix }).map((_, idx) => (
          <div key={`empty-${idx}`} className="calendar-day empty" />
        ))}

        {dayNumbers.map((date) => {
          const isToday = date === todayDate;
          const hasPost = scheduledDays.has(date);

          return (
            <div key={`date-wrapper-${date}`} className="calendar-day-cell">
              <div
                className={`calendar-day ${isToday ? 'date-today' : 'date-cream'}`}
              >
                {date}
              </div>
              {hasPost && <span className="calendar-scheduled-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
