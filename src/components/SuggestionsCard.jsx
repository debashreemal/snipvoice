import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

// NextSuggestionsCard: 3 dynamic pattern lines, Apply button, and before/after comparison
export default function SuggestionsCard({
  bestHookType,
  multiplier,
  eveningDiffPct,
  weakestPlatform,
  onApply
}) {
  const [savedConfirmation, setSavedConfirmation] = useState(false);

  const handleApplyClick = () => {
    // Generate actionable insights for the Learned panel
    const newNotes = [
      `Prioritizes ${bestHookType} hooks (~${multiplier}x views)`,
      `Schedules high-impact clips for evening (after 5 PM)`,
      `Uses punchier, shorter hooks on ${weakestPlatform}`
    ];
    onApply(newNotes);
    setSavedConfirmation(true);
  };

  return (
    <div className="suggestions-card">
      <h3 className="suggestions-title">Next suggestions</h3>

      {/* Dynamic computed lines */}
      <div className="suggestions-list">
        {bestHookType === '—' ? (
          <div className="suggestion-item">
            <span className="suggestion-bullet" />
            <p className="suggestion-text">
              Publish posts on the Calendar and enter metrics to unlock AI performance suggestions and scheduling optimizations.
            </p>
          </div>
        ) : (
          <>
            {/* Line 1: Best Hook Multiplier */}
            <div className="suggestion-item">
              <span className="suggestion-bullet" />
              <p className="suggestion-text">
                Your <strong>{bestHookType}</strong> hooks get <strong>{multiplier}x</strong> more views than other hooks. Double down on questions.
              </p>
            </div>

            {/* Line 2: Evening vs Morning percentage */}
            <div className="suggestion-item">
              <span className="suggestion-bullet" />
              <p className="suggestion-text">
                Evening posts (after 5 PM) perform <strong>{eveningDiffPct}%</strong> better than morning posts. Move more clips to 6 PM - 8 PM.
              </p>
            </div>

            {/* Line 3: Weakest platform */}
            <div className="suggestion-item">
              <span className="suggestion-bullet" />
              <p className="suggestion-text">
                Your <strong>{weakestPlatform}</strong> views are lagging. Try shorter hooks on {weakestPlatform}.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Apply to next week's plan button */}
      <div className="suggestions-actions">
        <button
          type="button"
          onClick={handleApplyClick}
          className="btn-apply-insights"
          disabled={savedConfirmation || bestHookType === '—'}
        >
          Apply to next week's plan
        </button>

        {/* Confirmation note and View Brand Voice link when saved */}
        {savedConfirmation && (
          <div className="suggestions-confirmed-group">
            <div className="suggestions-confirmation">
              <Check size={15} strokeWidth={2.5} />
              <span>Saved. Auto-plan will use these insights.</span>
            </div>
            <Link to="/brand-voice" className="link-view-brand-voice">
              <span>View brand voice</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          </div>
        )}
      </div>

      {/* Before and after comparison line */}
      <div className="suggestions-before-after">
        Last week's plan: 40% Question hooks. Next week: 60%.
      </div>
    </div>
  );
}
