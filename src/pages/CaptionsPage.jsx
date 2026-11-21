import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ProjectWorkspaceLayout from '../components/ProjectWorkspaceLayout';
import ClipCaptionSection from '../components/ClipCaptionSection';
import { Calendar } from 'lucide-react';

// Captions Page scoped to /projects/:id/captions
export default function CaptionsPage() {
  const { id } = useParams();
  const { getProject, projects } = useAppContext();

  const project = getProject(id) || projects[0];
  const clips = project?.clips || [];
  const approvedClips = clips.filter((c) => c.status === 'approved');

  return (
    <ProjectWorkspaceLayout project={project} activeTab="captions">
      <div className="captions-page-inner">
        <div className="workspace-sub-header">
          <div>
            <h2 className="workspace-section-title">Captions</h2>
            <p className="workspace-section-subtitle">
              Edit any caption. SnipVoice learns your style and applies it to future drafts.
            </p>
          </div>
        </div>

        {/* Empty State when no clips have been approved in this project */}
        {approvedClips.length === 0 ? (
          <div className="captions-empty-state">
            <p className="captions-empty-text">
              No approved clips yet. Approve some clips first in this project.
            </p>
            <Link to={`/projects/${project.id}/clips`} className="btn-go-clips">
              Go to Clips
            </Link>
          </div>
        ) : (
          /* Approved Clips Sections */
          <div className="captions-sections-list">
            {approvedClips.map((clip) => (
              <ClipCaptionSection
                key={clip.id}
                clip={clip}
                projectId={project.id}
              />
            ))}
          </div>
        )}

        {/* Bottom Right Next-Step Button */}
        {approvedClips.length > 0 && (
          <div className="page-bottom-actions">
            <Link
              to={`/calendar?project=${project.id}`}
              className="btn-bottom-next"
            >
              <span>Send to calendar</span>
              <Calendar size={16} strokeWidth={2.4} />
            </Link>
          </div>
        )}
      </div>
    </ProjectWorkspaceLayout>
  );
}
