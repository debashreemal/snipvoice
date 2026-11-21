import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Top bar breadcrumb showing current app location
export default function TopbarBreadcrumb() {
  const location = useLocation();
  const { projects } = useAppContext();
  const pathname = location.pathname;

  // Match /projects/:id/clips or /projects/:id/captions
  const projectClipsMatch = pathname.match(/^\/projects\/([^/]+)\/clips/);
  const projectCaptionsMatch = pathname.match(/^\/projects\/([^/]+)\/captions/);

  if (projectClipsMatch) {
    const projId = projectClipsMatch[1];
    const project = projects.find((p) => p.id === projId);
    return (
      <div className="topbar-breadcrumb">
        <Link to="/projects" className="breadcrumb-link">Projects</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-project">{project?.title || 'Project'}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Clips</span>
      </div>
    );
  }

  if (projectCaptionsMatch) {
    const projId = projectCaptionsMatch[1];
    const project = projects.find((p) => p.id === projId);
    return (
      <div className="topbar-breadcrumb">
        <Link to="/projects" className="breadcrumb-link">Projects</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-project">{project?.title || 'Project'}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Captions</span>
      </div>
    );
  }

  if (pathname === '/projects/new') {
    return (
      <div className="topbar-breadcrumb">
        <Link to="/projects" className="breadcrumb-link">Projects</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">New project</span>
      </div>
    );
  }

  if (pathname === '/projects') {
    return (
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-current">Projects</span>
      </div>
    );
  }

  if (pathname === '/brand-voice') {
    return (
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-current">Brand voice</span>
      </div>
    );
  }

  if (pathname === '/calendar') {
    return (
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-current">Calendar</span>
      </div>
    );
  }

  if (pathname === '/performance') {
    return (
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-current">Performance</span>
      </div>
    );
  }

  return (
    <div className="topbar-breadcrumb">
      <Link to="/projects" className="breadcrumb-link">Projects</Link>
    </div>
  );
}
