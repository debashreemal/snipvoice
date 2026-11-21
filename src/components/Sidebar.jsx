import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FolderKanban, Sparkles, Calendar, BarChart2, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

// Slim dark sidebar: Projects, Brand voice, Calendar, Performance, and Settings
export default function Sidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Brand voice', path: '/brand-voice', icon: Sparkles },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Performance', path: '/performance', icon: BarChart2 }
  ];

  return (
    <>
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'sidebar-item active' : 'sidebar-item'
                }
                aria-label={item.name}
              >
                <Icon size={22} strokeWidth={2.2} />
                <span className="tooltip">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Settings Link */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-item btn-sidebar-settings"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={22} strokeWidth={2.2} />
            <span className="tooltip">Settings</span>
          </button>
        </div>
      </aside>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}
