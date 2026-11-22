import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Check, ArrowRight, Pencil, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';

// 4-step progress line helper
function computeProjectProgress(project, scheduledSlots) {
  const clips = project.clips || [];
  const approvedClips = clips.filter((c) => c.status === 'approved');
  const isClipsDone = approvedClips.length > 0;

  // Captions ready
  let readyCaptions = 0;
  if (project.captionsState) {
    Object.values(project.captionsState).forEach((cap) => {
      if (cap.isEdited || cap.voiceMatch >= 85) readyCaptions++;
    });
  }
  const isCaptionsDone = isClipsDone && readyCaptions >= Math.max(1, approvedClips.length);

  // Scheduled slots
  const projectSlots = scheduledSlots.filter((s) => s.projectId === project.id);
  const isScheduledDone = projectSlots.length > 0;
  const postedSlots = projectSlots.filter((s) => s.isPosted);
  const isPostedDone = postedSlots.length > 0;

  // Determine first unfinished step and target route
  let nextStepRoute = `/projects/${project.id}/clips`;
  let nextStepLabel = 'Review clips';

  if (!isClipsDone) {
    nextStepRoute = `/projects/${project.id}/clips`;
    nextStepLabel = 'Review clips';
  } else if (!isCaptionsDone) {
    nextStepRoute = `/projects/${project.id}/captions`;
    nextStepLabel = 'Edit captions';
  } else if (!isScheduledDone) {
    nextStepRoute = `/calendar?project=${project.id}`;
    nextStepLabel = 'Plan schedule';
  } else {
    nextStepRoute = `/calendar?project=${project.id}`;
    nextStepLabel = 'View schedule';
  }

  return {
    isClipsDone,
    isCaptionsDone,
    isScheduledDone,
    isPostedDone,
    approvedCount: approvedClips.length,
    totalClips: clips.length,
    readyCaptions,
    scheduledCount: projectSlots.length,
    postedCount: postedSlots.length,
    nextStepRoute,
    nextStepLabel
  };
}

// Format numbers (e.g. 50600 -> "50.6k")
function formatMetric(num) {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, scheduledSlots, performancePosts, renameProject } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (project) => {
    setEditingProjectId(project.id);
    setEditingTitle(project.title);
  };

  const handleSaveRename = (projectId) => {
    if (editingTitle && editingTitle.trim()) {
      renameProject(projectId, editingTitle.trim());
    }
    setEditingProjectId(null);
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setEditingTitle('');
  };

  // 4 Top Stats
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalApprovedClips = projects.reduce((sum, p) => {
      const app = p.clips?.filter((c) => c.status === 'approved').length || 0;
      return sum + app;
    }, 0);
    const totalScheduled = scheduledSlots.length;

    const totalViews = performancePosts.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
    const avgViews = performancePosts.length > 0 ? Math.round(totalViews / performancePosts.length) : 0;

    return {
      totalProjects,
      totalApprovedClips,
      totalScheduled,
      avgViews: formatMetric(avgViews)
    };
  }, [projects, scheduledSlots, performancePosts]);

  // Filtered projects
  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="projects-page">
      {/* Top Header */}
      <div className="projects-header-row">
        <div>
          <h1 className="page-title">Your projects</h1>
          <p className="page-subtitle">
            Manage your repurposing pipelines from raw transcript to published content.
          </p>
        </div>

        <Link to="/projects/new" className="btn-primary-action">
          <Plus size={18} strokeWidth={2.4} />
          <span>New project</span>
        </Link>
      </div>

      {/* Row of 4 Stat Cards */}
      <div className="projects-stats-row">
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          sublabel="Active workspaces"
          icon={FolderKanban}
        />
        <StatCard
          label="Clips approved"
          value={stats.totalApprovedClips}
          sublabel="Across all projects"
        />
        <StatCard
          label="Posts scheduled"
          value={stats.totalScheduled}
          sublabel="This week's plan"
        />
        <StatCard
          label="Avg views"
          value={stats.avgViews}
          sublabel="Per published clip"
        />
      </div>

      {/* Search Bar */}
      <div className="projects-search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search projects by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of Projects */}
      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="projects-empty-card" style={{ gridColumn: '1 / -1', padding: '64px 24px', textAlign: 'center', backgroundColor: 'var(--card-dark)', borderRadius: 'var(--radius)', color: 'var(--text-on-dark)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--sky-bright)' }}>No projects yet</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Click &quot;New project&quot; at the top to start repurposing your first podcast or video.
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const progress = computeProjectProgress(project, scheduledSlots);

            return (
              <div key={project.id} className="project-card">
                <div className="project-card-top">
                  <span className="project-card-date">{project.createdAt}</span>
                  {editingProjectId !== project.id && (
                    <button
                      type="button"
                      className="btn-rename-project"
                      onClick={() => handleStartRename(project)}
                      title="Rename project title"
                    >
                      <Pencil size={11} strokeWidth={2.4} />
                      <span>Rename</span>
                    </button>
                  )}
                </div>

                {editingProjectId === project.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveRename(project.id);
                    }}
                    className="project-rename-form"
                  >
                    <input
                      type="text"
                      className="project-rename-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                    />
                    <div className="project-rename-btns">
                      <button type="submit" className="btn-rename-save" title="Save title">
                        <Check size={13} strokeWidth={2.8} />
                      </button>
                      <button type="button" className="btn-rename-cancel" onClick={handleCancelRename} title="Cancel">
                        <X size={13} strokeWidth={2.8} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <h3 className="project-card-title" title={project.title}>
                    {project.title}
                  </h3>
                )}

              {/* 4-Step Progress Line */}
              <div className="project-progress-container">
                <div className="project-progress-steps">
                  <div className={`progress-step-pill ${progress.isClipsDone ? 'is-complete' : ''}`}>
                    {progress.isClipsDone && <Check size={11} strokeWidth={3} />}
                    <span>Clips</span>
                  </div>
                  <div className={`progress-step-pill ${progress.isCaptionsDone ? 'is-complete' : ''}`}>
                    {progress.isCaptionsDone && <Check size={11} strokeWidth={3} />}
                    <span>Captions</span>
                  </div>
                  <div className={`progress-step-pill ${progress.isScheduledDone ? 'is-complete' : ''}`}>
                    {progress.isScheduledDone && <Check size={11} strokeWidth={3} />}
                    <span>Scheduled</span>
                  </div>
                  <div className={`progress-step-pill ${progress.isPostedDone ? 'is-complete' : ''}`}>
                    {progress.isPostedDone && <Check size={11} strokeWidth={3} />}
                    <span>Posted</span>
                  </div>
                </div>
              </div>

              {/* Counts summary line */}
              <div className="project-card-counts">
                <span>{progress.approvedCount} of {progress.totalClips} clips approved</span>
                <span className="count-separator">•</span>
                <span>{progress.readyCaptions} captions ready</span>
                {progress.scheduledCount > 0 && (
                  <>
                    <span className="count-separator">•</span>
                    <span>{progress.scheduledCount} scheduled ({progress.postedCount} posted)</span>
                  </>
                )}
              </div>

              {/* Card Footer with Open Button */}
              <div className="project-card-footer">
                <Link
                  to={progress.nextStepRoute}
                  className="btn-open-project"
                >
                  <span>{progress.nextStepLabel}</span>
                  <ArrowRight size={15} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
