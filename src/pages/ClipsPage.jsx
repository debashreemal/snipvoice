import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ClipCard from '../components/ClipCard';
import ProjectWorkspaceLayout from '../components/ProjectWorkspaceLayout';
import { ArrowRight } from 'lucide-react';

// Clips Page scoped to /projects/:id/clips
export default function ClipsPage() {
  const { id } = useParams();
  const { getProject, handleApprove, handleReject, projects } = useAppContext();

  // Find project or fallback to first
  const project = getProject(id) || projects[0];
  const clips = project?.clips || [];
  const approvedClips = clips.filter((c) => c.status === 'approved');

  return (
    <ProjectWorkspaceLayout project={project} activeTab="clips">
      <div className="clips-page-inner">
        <div className="workspace-sub-header">
          <div>
            <h2 className="workspace-section-title">Curated clips</h2>
            <p className="workspace-section-subtitle">
              {clips.length} moments selected based on hook score and retention potential.
            </p>
          </div>
        </div>

        <div className="clips-list">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onApprove={(clipId) => handleApprove(project.id, clipId)}
              onReject={(clipId) => handleReject(project.id, clipId)}
            />
          ))}
        </div>

        {/* Bottom Right Next-Step Action */}
        <div className="page-bottom-actions">
          <Link
            to={approvedClips.length > 0 ? `/projects/${project.id}/captions` : '#'}
            className={`btn-bottom-next ${approvedClips.length === 0 ? 'is-disabled' : ''}`}
            onClick={(e) => {
              if (approvedClips.length === 0) e.preventDefault();
            }}
            title={approvedClips.length === 0 ? 'Approve at least 1 clip to continue' : 'Continue to captions'}
          >
            <span>Continue to captions</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </ProjectWorkspaceLayout>
  );
}
