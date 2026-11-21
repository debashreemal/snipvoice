import React from 'react';
import { Calendar, BarChart2, PenLine, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  {
    label: 'Summarise my week',
    icon: Calendar,
  },
  {
    label: 'Which hook type works best for me?',
    icon: BarChart2,
  },
  {
    label: 'What has SnipVoice learned about my style?',
    icon: PenLine,
  },
  {
    label: 'What should I post next?',
    icon: Lightbulb,
  },
];

// Empty state suggestion list with 4 vertical prompt cards
export default function SuggestionList({ onSelectSuggestion }) {
  return (
    <div className="ask-empty-state">
      <h3 className="ask-empty-heading">What do you want to know?</h3>
      <div className="ask-suggestions-stack">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className="ask-suggestion-btn"
              onClick={() => onSelectSuggestion(item.label)}
            >
              <span className="ask-suggestion-icon">
                <Icon size={18} strokeWidth={2.4} />
              </span>
              <span className="ask-suggestion-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
