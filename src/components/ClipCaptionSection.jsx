import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PLATFORMS } from '../data/mock';
import CaptionCard from './CaptionCard';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../lib/api';

// Section grouping 3 platform caption cards for an approved clip within a project
export default function ClipCaptionSection({ clip, projectId }) {
  const { id: clipId, hookLine, timeRange } = clip;
  const { getCaptionData, setClipCaptions } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check if captions for this clip already exist in local store
  const instagramData = getCaptionData(projectId, clipId, 'instagram');
  const hasLocalCaptions = Boolean(instagramData?.text && instagramData.text.trim().length > 0);

  // Fetch from database or generate via /api/captions
  const loadOrGenerateCaptions = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Check if captions already exist in Supabase database
      let dbData = null;
      try {
        dbData = await apiFetch(`/api/captions?clipId=${clipId}`);
      } catch (getErr) {
        // GET check is optional; proceed to generation if not found
        console.warn('GET /api/captions check notice:', getErr.message);
      }

      if (dbData && Array.isArray(dbData.captions) && dbData.captions.length > 0) {
        setClipCaptions(projectId, clipId, dbData.captions);
        setIsLoading(false);
        return;
      }

      // 2. If no captions in database, call POST /api/captions for all three platforms
      const genData = await apiFetch('/api/captions', {
        method: 'POST',
        body: {
          clipId,
          platforms: ['Instagram', 'LinkedIn', 'X'],
        },
      });

      if (genData && Array.isArray(genData.captions) && genData.captions.length > 0) {
        setClipCaptions(projectId, clipId, genData.captions);
      } else {
        throw new Error('Could not write captions. Try again.');
      }
    } catch (err) {
      console.error('Caption load/generate error:', err);
      setErrorMessage('Could not write captions. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch/generate if store doesn't already have text for this clip
    if (!hasLocalCaptions) {
      loadOrGenerateCaptions();
    }
  }, [clipId, projectId]);

  return (
    <section className="clip-caption-section">
      {/* Section Header: Hook Line and Time Range */}
      <div className="clip-caption-header">
        <h3 className="clip-caption-hook">
          "{hookLine}"
        </h3>
        <span className="clip-caption-time">
          {timeRange}
        </span>
      </div>

      {/* Loading State for this Clip's Section */}
      {isLoading ? (
        <div className="clip-caption-loading-box">
          <Loader2 size={18} strokeWidth={2.4} className="spin-icon" />
          <span>Writing captions in your voice...</span>
        </div>
      ) : errorMessage ? (
        /* Error State with Retry Button */
        <div className="clip-caption-error-box">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="btn-retry-caption"
            onClick={loadOrGenerateCaptions}
          >
            Retry
          </button>
        </div>
      ) : (
        /* 3 Caption Cards Grid */
        <div className="caption-cards-grid">
          {PLATFORMS.map((platform) => (
            <CaptionCard
              key={platform.id}
              clipId={clipId}
              platform={platform}
              projectId={projectId}
              isParentLoading={isLoading}
            />
          ))}
        </div>
      )}
    </section>
  );
}
