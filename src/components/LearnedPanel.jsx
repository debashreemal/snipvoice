import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Right side dark card showing dynamic notes learned from user's caption edits
export default function LearnedPanel() {
  const { learnedNotes, recentlyAddedNotes, edits } = useAppContext();

  return (
    <section className="learned-card">
      <div className="learned-card-header">
        <h3 className="learned-card-title">Learned from your edits</h3>
        <Link to="/brand-voice" className="learned-view-all" title="View brand voice profile and all rules">
          View all
        </Link>
      </div>

      <div className="learned-notes-list">
        {learnedNotes.length === 0 ? (
          <div className="learned-empty-text">
            Nothing learned yet. Edit a caption to teach SnipVoice.
          </div>
        ) : (
          learnedNotes.map((note, index) => {
            const isHighlighted = recentlyAddedNotes.includes(note);
            return (
              <div
                key={index}
                className={`learned-note-item ${isHighlighted ? 'is-highlighted' : ''}`}
              >
                <span className="learned-dot" />
                <span className="learned-note-text">{note}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Counter under the notes */}
      <div className="learned-edits-counter">
        Edits saved: {edits.length}
      </div>
    </section>
  );
}
