import React from 'react';
import {
  Calendar,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Video,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

function getPlatformIcon(platform) {
  switch (platform) {
    case 'instagram':
      return <Instagram size={13} strokeWidth={2.4} />;
    case 'linkedin':
      return <Linkedin size={13} strokeWidth={2.4} />;
    case 'x':
      return <Twitter size={13} strokeWidth={2.4} />;
    case 'youtube':
    default:
      return <Video size={13} strokeWidth={2.4} />;
  }
}

// Confirmation panel shown before auto-plan slots are saved
export default function PlanConfirmModal({
  draftPlan,
  summary,
  changedCount,
  onApprove,
  onDiscard,
  isApproving,
}) {
  if (!draftPlan || draftPlan.length === 0) return null;

  // Compute unique platforms and unique days count
  const uniquePlatforms = new Set(draftPlan.map((s) => s.platform)).size;
  const uniqueDays = new Set(draftPlan.map((s) => s.day)).size;
  const totalPosts = draftPlan.length;

  return (
    <div className="plan-confirm-overlay" onClick={onDiscard}>
      <div className="plan-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="plan-confirm-header">
          <div className="plan-confirm-title-group">
            <h2 className="plan-confirm-title">Review weekly auto-plan</h2>
            <p className="plan-confirm-subtitle">
              {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} across {uniquePlatforms}{' '}
              {uniquePlatforms === 1 ? 'platform' : 'platforms'} and {uniqueDays}{' '}
              {uniqueDays === 1 ? 'day' : 'days'}.
            </p>
          </div>
          <button
            type="button"
            className="btn-discard-icon"
            onClick={onDiscard}
            title="Discard draft plan"
            disabled={isApproving}
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Dynamic summary if slots were modified using performance insights */}
        {changedCount > 0 && (
          <div className="plan-changed-summary-pill">
            <Sparkles size={14} strokeWidth={2.4} />
            <span>
              {summary || `${changedCount} slots changed using your last results.`}
            </span>
          </div>
        )}

        {/* Compact Slot List */}
        <div className="plan-confirm-list">
          {draftPlan.map((slot, index) => {
            const hasChanged = Boolean(slot.changed_because);

            return (
              <div key={slot.id || index} className="plan-confirm-row">
                {/* Date & Time */}
                <div className="plan-confirm-time-col">
                  <span className="plan-confirm-day">
                    {(slot.day || 'mon').toUpperCase()}
                  </span>
                  <span className="plan-confirm-time">{slot.time}</span>
                </div>

                {/* Platform Badge */}
                <div className={`plan-confirm-plat-badge plat-${slot.platform}`}>
                  {getPlatformIcon(slot.platform)}
                  <span>{slot.platformName || slot.platform}</span>
                </div>

                {/* Clip Hook Line & Reason */}
                <div className="plan-confirm-hook-col">
                  <div className="plan-confirm-hook-text">
                    &ldquo;{slot.hookLine}&rdquo;
                  </div>
                  {hasChanged ? (
                    <div className="plan-confirm-changed-reason">
                      {slot.changed_because}
                    </div>
                  ) : (
                    <div className="plan-confirm-normal-reason">{slot.reason}</div>
                  )}
                </div>

                {/* Changed Tag */}
                <div className="plan-confirm-tag-col">
                  {hasChanged && (
                    <span
                      className="slot-changed-tag"
                      title={slot.changed_because}
                    >
                      Changed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons: Approve plan (--sky-bright) and Discard (white) */}
        <div className="plan-confirm-footer">
          <button
            type="button"
            className="btn-discard-plan"
            onClick={onDiscard}
            disabled={isApproving}
          >
            Discard
          </button>
          <button
            type="button"
            className="btn-approve-plan"
            onClick={onApprove}
            disabled={isApproving}
          >
            <Check size={15} strokeWidth={2.6} />
            <span>{isApproving ? 'Saving plan...' : 'Approve plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
