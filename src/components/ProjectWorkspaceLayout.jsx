import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Film, FileText, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Reusable project workspace header with step tabs: 1 Clips, 2 Captions, 3 Schedule
export default function ProjectWorkspaceLayout({ project, activeTab, children }) {
  const navigate = useNavigate();
  const { scheduledSlots } = useAppContext();

  if (!project) {
    return (
      <div className="workspace-not-found">
        <p>Project not found.</p>
        <Link to="/projects" className="btn-secondary">Back to projects</Link>
      </div>
    );
  }

  const clips = project.clips || [];
  const approvedClips = clips.filter((c) => c.status === 'approved');
  const isClipsDone = approvedClips.length > 0 && clips.every((c) => c.status !== null);

  // Captions ready count
  let readyCaptionsCount = 0;
  if (project.captionsState) {
    Object.values(project.captionsState).forEach((cap) => {
      if (cap.isEdited || cap.voiceMatch >= 85) readyCaptionsCount++;
    });
  }
  const isCaptionsDone = readyCaptionsCount >= (approvedClips.length * 2);

  // Scheduled slots for this project
  const projectSlots = scheduledSlots.filter((s) => s.projectId === project.id);
  const isScheduledDone = projectSlots.length > 0;

  return (
    <div className="project-workspace">
      {/* Workspace Header Row */}
      <div className="workspace-header">
        <div className="workspace-top-bar">
          <Link to="/projects" className="workspace-back-btn">
            <ArrowLeft size={16} strokeWidth={2.4} />
            <span>Projects</span>
          </Link>
          <span className="workspace-created-date">{project.createdAt}</span>
        </div>

        <h1 className="workspace-project-title">{project.title}</h1>

        {/* Step Tabs Row */}
        <div className="workspace-tabs-row">
          {/* Tab 1: Clips */}
          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}/clips`)}
            className={`workspace-tab-btn ${activeTab === 'clips' ? 'is-active' : ''}`}
          >
            <div className="tab-badge">
              {isClipsDone ? <Check size={14} strokeWidth={3} /> : '1'}
            </div>
            <div className="tab-labels">
              <span className="tab-name">Clips</span>
              <span className="tab-subtext">
                {approvedClips.length > 0
                  ? `${approvedClips.length} of ${clips.length} approved`
                  : `${clips.length} moments`}
              </span>
            </div>
          </button>

          {/* Tab 2: Captions */}
          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}/captions`)}
            className={`workspace-tab-btn ${activeTab === 'captions' ? 'is-active' : ''}`}
          >
            <div className="tab-badge">
              {isCaptionsDone ? <Check size={14} strokeWidth={3} /> : '2'}
            </div>
            <div className="tab-labels">
              <span className="tab-name">Captions</span>
              <span className="tab-subtext">
                {readyCaptionsCount > 0 ? `${readyCaptionsCount} ready` : 'Multi-platform'}
              </span>
            </div>
          </button>

          {/* Tab 3: Schedule */}
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className={`workspace-tab-btn ${activeTab === 'schedule' ? 'is-active' : ''}`}
          >
            <div className="tab-badge">
              {isScheduledDone ? <Check size={14} strokeWidth={3} /> : '3'}
            </div>
            <div className="tab-labels">
              <span className="tab-name">Schedule</span>
              <span className="tab-subtext">
                {projectSlots.length > 0 ? `${projectSlots.length} scheduled` : 'Auto-plan'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="workspace-content">
        {children}
      </div>
    </div>
  );
}
