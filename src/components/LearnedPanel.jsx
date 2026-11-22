import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Right side dark card: Learned memory (global stylistic rules from caption edits)
export default function LearnedPanel() {
  const { learnedNotes, recentlyAddedNotes, edits, projects } = useAppContext();

  // Average voice match across all projects
  const avgVoiceMatch = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    if (Array.isArray(projects)) {
      projects.forEach((proj) => {
        if (proj && proj.captionsState) {
          Object.values(proj.captionsState).forEach((cap) => {
            if (cap && typeof cap.voiceMatch === 'number') {
              totalScore += cap.voiceMatch;
              count++;
            }
          });
        }
      });
    }
    return count > 0 ? `${Math.round(totalScore / count)}%` : '—';
  }, [projects]);

  return (
    <section className="learned-card">
      <div className="card-section-header">
        <div className="title-with-icon">
          <Sparkles size={18} strokeWidth={2.2} />
          <h2 className="card-heading">Learned memory</h2>
        </div>
        <p className="card-subheading">
          Global stylistic rules synthesized from all your caption edits.
        </p>
      </div>

      {/* Quick Metrics Bar */}
      <div className="memory-metrics-row">
        <div className="memory-metric-box">
          <span className="metric-num">{edits?.length || 0}</span>
          <span className="metric-lbl">Edits saved</span>
        </div>
        <div className="memory-metric-box">
          <span className="metric-num">{avgVoiceMatch}</span>
          <span className="metric-lbl">Avg voice match</span>
        </div>
      </div>

      {/* Learned Notes List */}
      <div className="learned-memory-list">
        {(!learnedNotes || learnedNotes.length === 0) ? (
          <p className="empty-memory-text">
            No rules learned yet. Edit and save captions in any project to train your voice.
          </p>
        ) : (
          learnedNotes.map((note, idx) => {
            const isHighlighted = recentlyAddedNotes?.includes(note);
            return (
              <div
                key={idx}
                className={`memory-rule-item ${isHighlighted ? 'is-highlighted' : ''}`}
              >
                <span className="memory-rule-bullet" />
                <span className="memory-rule-text">{note}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
