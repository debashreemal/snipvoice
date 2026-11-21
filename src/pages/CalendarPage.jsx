import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart2,
  Sparkles,
  Plus,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Download
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import WeekGrid from '../components/WeekGrid';
import AgendaView from '../components/AgendaView';
import SlotPanel from '../components/SlotPanel';
import AddSlotModal from '../components/AddSlotModal';
import ProjectSearchSelector from '../components/ProjectSearchSelector';

const PLATFORM_FILTERS = [
  { key: 'all', label: 'All platforms' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X / Twitter' },
  { key: 'youtube', label: 'YouTube Shorts' }
];

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const {
    projects,
    scheduledSlots,
    isAutoPlanning,
    hasAppliedInsights,
    autoPlanWeek,
    addSlot,
    updateSlot,
    removeSlot,
    markSlotPosted
  } = useAppContext();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState(projectParam || 'all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'agenda'

  // Schedule modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDay, setAddModalDay] = useState('mon');

  // Sync if URL search param changes
  useEffect(() => {
    if (projectParam) {
      setSelectedProjectId(projectParam);
    }
  }, [projectParam]);

  const weekLabels = [
    '23 Nov – 29 Nov 2026',
    '30 Nov – 6 Dec 2026',
    '7 Dec – 13 Dec 2026'
  ];

  const handlePrevWeek = () => {
    setCurrentWeekIndex((prev) => (prev > 0 ? prev - 1 : weekLabels.length - 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekIndex((prev) => (prev < weekLabels.length - 1 ? prev + 1 : 0));
  };

  const handleTodayClick = () => {
    setCurrentWeekIndex(0);
  };

  // Filter slots by selected project and platform
  const visibleSlots = useMemo(() => {
    let list = scheduledSlots;
    if (selectedProjectId !== 'all') {
      list = list.filter((s) => s.projectId === selectedProjectId);
    }
    if (selectedPlatform !== 'all') {
      list = list.filter((s) => s.platform === selectedPlatform);
    }
    return list;
  }, [scheduledSlots, selectedProjectId, selectedPlatform]);

  // Dynamic summary calculated from visible slots
  const totalPosts = visibleSlots.length;
  const uniqueDaysCount = new Set(visibleSlots.map((s) => s.day)).size;
  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Check if planned using results
  const hasInsightsSlots = hasAppliedInsights || visibleSlots.some((s) => s.plannedWithInsights);

  // Find the live version of selectedSlot from state
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

  const handleOpenAddForDay = (dayKey) => {
    setAddModalDay(dayKey || 'mon');
    setIsAddModalOpen(true);
  };

  // Export scheduled posts to CSV in the browser
  const handleExportCsv = () => {
    if (!scheduledSlots || scheduledSlots.length === 0) return;

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = ['project', 'clip hook', 'platform', 'date', 'time', 'status', 'caption text'];

    const rows = scheduledSlots.map((slot) => {
      const proj = projects.find((p) => p.id === slot.projectId);
      const projTitle = slot.projectName || proj?.title || 'Project';
      const dayObj = WEEK_DAYS.find((d) => d.key === slot.day);
      const dateStr = dayObj ? `${dayObj.name} (${dayObj.date})` : slot.day;
      const statusStr = slot.isPosted ? 'Posted' : 'Scheduled';

      const capKey = `${slot.clipId}_${String(slot.platform || '').toLowerCase()}`;
      const capText = proj?.captionsState?.[capKey]?.text || slot.hookLine || '';

      return [
        escapeCsv(projTitle),
        escapeCsv(slot.hookLine),
        escapeCsv(slot.platformName || slot.platform),
        escapeCsv(dateStr),
        escapeCsv(slot.time),
        escapeCsv(statusStr),
        escapeCsv(capText),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'snipvoice-content-calendar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="calendar-page">
      {/* Page Header */}
      <div className="page-header calendar-page-header">
        <div>
          <h1 className="page-title">Content calendar</h1>
          <p className="page-subtitle">
            Plan, schedule, and automate your multi-platform distribution.
          </p>
        </div>

        <div className="calendar-header-actions">
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => handleOpenAddForDay('mon')}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>Schedule post</span>
          </button>
        </div>
      </div>

      {/* Primary Toolbar: Project selector, View switch, Week navigation, Auto-plan */}
      <div className="calendar-toolbar-row">
        {/* Left: Project filter & View Switcher */}
        <div className="calendar-toolbar-left">
          <ProjectSearchSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            placeholder="Search projects in calendar..."
          />

          {/* View Switcher: Grid vs Agenda */}
          <div className="calendar-view-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="7-Day Grid View"
            >
              <LayoutGrid size={14} strokeWidth={2.4} />
              <span>Week grid</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'agenda' ? 'is-active' : ''}`}
              onClick={() => setViewMode('agenda')}
              title="Chronological List View"
            >
              <List size={14} strokeWidth={2.4} />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Right: Export CSV, Auto-plan & Week Navigation */}
        <div className="calendar-toolbar-right">
          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCsv}
            title="Download CSV of all scheduled posts"
          >
            <Download size={14} strokeWidth={2.4} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-auto-plan"
            onClick={handleAutoPlanClick}
            disabled={isAutoPlanning}
          >
            <Sparkles size={14} strokeWidth={2.4} />
            <span>{isAutoPlanning ? 'Planning week...' : 'Auto-plan my week'}</span>
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
            <button
              type="button"
              className="btn-week-today"
              onClick={handleTodayClick}
              title="Jump to current week"
            >
              Today
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
      </div>

      {/* Platform Filter Pills */}
      <div className="platform-filter-bar">
        {PLATFORM_FILTERS.map((pf) => (
          <button
            key={pf.key}
            type="button"
            className={`platform-filter-pill ${selectedPlatform === pf.key ? 'is-active' : ''}`}
            onClick={() => setSelectedPlatform(pf.key)}
          >
            {pf.label}
          </button>
        ))}
      </div>

      {/* Summary Info & Helper Callout */}
      <div className="calendar-info-row">
        {totalPosts > 0 ? (
          <div className="calendar-summary-line">
            <strong>{totalPosts} {totalPosts === 1 ? 'post' : 'posts'}</strong> scheduled across{' '}
            <strong>{uniqueDaysCount} {uniqueDaysCount === 1 ? 'day' : 'days'}</strong>
            {activeProject ? ` for "${activeProject.title}"` : ' across all projects'}.
          </div>
        ) : (
          <div className="calendar-empty-callout">
            <CalendarIcon size={16} strokeWidth={2.2} />
            <span>
              Your 7-day schedule is clear. Click <strong>&ldquo;Auto-plan my week&rdquo;</strong> to generate optimal schedule times, or click <strong>&ldquo;+&rdquo;</strong> on any day to schedule manually.
            </span>
          </div>
        )}

        {hasInsightsSlots && (
          <div className="insights-applied-note">
            <Sparkles size={14} strokeWidth={2.4} />
            <span>Optimized with performance retention insights</span>
          </div>
        )}
      </div>

      {/* Main Calendar Display: Never Blank, Always Full-Featured */}
      <div className="calendar-main-area">
        {isAutoPlanning ? (
          <div className="calendar-loading-box">
            <span className="calendar-loading-text">Auto-planning optimal schedule times...</span>
          </div>
        ) : viewMode === 'grid' ? (
          <WeekGrid
            slots={visibleSlots}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            onAddSlotToDay={handleOpenAddForDay}
          />
        ) : (
          <AgendaView
            slots={visibleSlots}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            onAddSlotToDay={handleOpenAddForDay}
          />
        )}
      </div>

      {/* Side / Modal Panel for Selected Slot Details & Results */}
      {activeSlot && (
        <SlotPanel
          slot={activeSlot}
          onClose={() => setSelectedSlot(null)}
          onUpdate={updateSlot}
          onRemove={removeSlot}
          onMarkPosted={markSlotPosted}
        />
      )}

      {/* Add Slot Modal */}
      {isAddModalOpen && (
        <AddSlotModal
          initialDay={addModalDay}
          projects={projects}
          onClose={() => setIsAddModalOpen(false)}
          onAddSlot={addSlot}
        />
      )}

      {/* Bottom Right Next-Step Button */}
      <div className="page-bottom-actions">
        <Link to="/performance" className="btn-bottom-next">
          <span>See performance analytics</span>
          <BarChart2 size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}
