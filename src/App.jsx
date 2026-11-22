import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import LearnedPanel from './components/LearnedPanel';
import ChatPanel from './components/ChatPanel';
import ProjectsPage from './pages/ProjectsPage';
import NewProjectPage from './pages/NewProjectPage';
import ClipsPage from './pages/ClipsPage';
import CaptionsPage from './pages/CaptionsPage';
import BrandVoicePage from './pages/BrandVoicePage';
import CalendarPage from './pages/CalendarPage';
import PerformancePage from './pages/PerformancePage';
import './App.css';

// SnipVoice root layout shell with AppProvider, dynamic breadcrumb and 7-route navigation
export default function App() {
  return (
    <AppProvider>
      <div className="app-wrapper">
        {/* Slim Top Bar */}
        <header className="app-topbar">
          <div className="topbar-brand-group">
            <Link to="/projects" className="topbar-brand">
              <span className="brand-snip">Snip</span>
              <span className="brand-voice">Voice</span>
            </Link>
          </div>
          <span className="topbar-tagline">
            One video. A week of content. In your voice.
          </span>
        </header>

        <div className="app-container">
          {/* Left slim sidebar */}
          <Sidebar />

          {/* Center main panel */}
          <main className="main-panel">
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<NewProjectPage />} />
              <Route path="/projects/:id/clips" element={<ClipsPage />} />
              <Route path="/projects/:id/captions" element={<CaptionsPage />} />
              <Route path="/brand-voice" element={<BrandVoicePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </main>

          {/* Right side panel: Global Learned Memory */}
          <aside className="side-panel">
            <LearnedPanel />
          </aside>

          {/* Ask SnipVoice sliding chat panel */}
          <ChatPanel />
        </div>
      </div>
    </AppProvider>
  );
}
