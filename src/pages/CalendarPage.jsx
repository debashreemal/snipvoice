import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, BarChart2, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import WeekGrid from '../components/WeekGrid';
import SlotPanel from '../components/SlotPanel';

// Calendar Page: schedule and optimize weekly multi-platform distribution across projects
export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const {
    projects,
    approvedClips,
    scheduledSlots,
    isAutoPlanning,
    hasAppliedInsights,
    autoPlanWeek,
    updateSlot,
    removeSlot,
    markSlotPosted
  } = useAppContext();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState(projectParam || 'all');

  // Sync if URL search param changes
  useEffect(() => {
    if (projectParam) {
      setSelectedProjectId(projectParam);
    }
  }, [projectParam]);

  const weekLabels = [
    '23 Nov - 29 Nov',
    '30 Nov - 6 Dec',
    '7 Dec - 13 Dec'
  ];

  const handlePrevWeek = () => {
    setCurrentWeekIndex((prev) => (prev > 0 ? prev - 1 : weekLabels.length - 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekIndex((prev) => (prev < weekLabels.length - 1 ? prev + 1 : 0));
  };

  // Filter slots by selected project (or all)
  const visibleSlots = selectedProjectId === 'all'
    ? scheduledSlots
    : scheduledSlots.filter((s) => s.projectId === selectedProjectId);

  // Dynamic summary calculated from visible slots
  const totalPosts = visibleSlots.length;
  const uniqueDaysCount = new Set(visibleSlots.map((s) => s.day)).size;
  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const summaryText = `${totalPosts} ${totalPosts === 1 ? 'post' : 'posts'} planned across ${uniqueDaysCount} ${uniqueDaysCount === 1 ? 'day' : 'days'}${activeProject ? ` for "${activeProject.title}"` : ' across all projects'}.`;

  // Check if planned using results
  const hasInsightsSlots = hasAppliedInsights || visibleSlots.some((s) => s.plannedWithInsights);

  // Find the live version of selectedSlot from state in case it was updated
  const activeSlot = selectedSlot
    ? scheduledSlots.find((s) => s.id === selectedSlot.id) || null
    : null;

  const handleAutoPlanClick = () => {
    if (selectedProjectId !== 'all') {
      autoPlanWeek(selectedProjectId);
    } else {
      autoPlanWeek(projects[0]?.id);
    }
  };

  return (
    <div className="calendar-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">
          Plan when each clip goes live. Change any slot you want.
        </p>
      </div>

      {/* Top Filter & Toolbar Bar */}
      <div className="calendar-toolbar-row">
        {/* Project Filter Dropdown */}
        <div className="project-filter-group">
          <Filter size={15} strokeWidth={2.4} className="filter-icon" />
          <span className="filter-label">Project:</span>
          <select
            className="project-filter-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">All projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-plan & Week switcher */}
        {approvedClips.length > 0 && (
          <div className="calendar-toolbar">
            <button
              type="button"
              className="btn-auto-plan"
              onClick={handleAutoPlanClick}
              disabled={isAutoPlanning}
            >
              {isAutoPlanning ? 'Planning your week...' : 'Auto-plan my week'}
            </button>

            <div className="week-switcher">
              <button
                type="button"
                className="btn-week-nav"
                onClick={handlePrevWeek}
                aria-label="Previous week"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="week-switcher-text">{weekLabels[currentWeekIndex]}</span>
              <button
                type="button"
                className="btn-week-nav"
                onClick={handleNextWeek}
                aria-label="Next week"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State when no clips approved */}
      {approvedClips.length === 0 ? (
        <div className="captions-empty-state">
          <p className="captions-empty-text">
            No approved clips yet. Approve some clips first in your projects.
          </p>
          <Link to="/projects" className="btn-go-clips">
            Go to Projects
          </Link>
        </div>
      ) : isAutoPlanning ? (
        /* Loading State */
        <div className="calendar-loading-box">
          <span className="calendar-loading-text">Planning your week...</span>
        </div>
      ) : (
        /* Main Calendar Area */
        <div className="calendar-main-area">
          {/* Summary line + Insights note above the grid */}
          <div className="calendar-info-row">
            {totalPosts > 0 && (
              <div className="calendar-summary-line">
                {summaryText}
              </div>
            )}
            {hasInsightsSlots && (
              <div className="insights-applied-note">
                <Sparkles size={14} strokeWidth={2.4} />
                <span>Planned using your last results.</span>
              </div>
            )}
          </div>

          {/* 7-column Week Grid */}
          <WeekGrid
            slots={visibleSlots}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
          />
        </div>
      )}

      {/* Side / Modal Panel for Selected Slot */}
      {activeSlot && (
        <SlotPanel
          slot={activeSlot}
          onClose={() => setSelectedSlot(null)}
          onUpdate={updateSlot}
          onRemove={removeSlot}
          onMarkPosted={markSlotPosted}
        />
      )}

      {/* Bottom Right Next-Step Button */}
      <div className="page-bottom-actions">
        <Link to="/performance" className="btn-bottom-next">
          <span>See performance</span>
          <BarChart2 size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}
