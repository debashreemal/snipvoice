import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderKanban, Sparkles, Calendar, BarChart2 } from 'lucide-react';

// Slim dark sidebar: Projects, Brand voice, Calendar, Performance
export default function Sidebar() {
  const navItems = [
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Brand voice', path: '/brand-voice', icon: Sparkles },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Performance', path: '/performance', icon: BarChart2 }
  ];

  return (
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
    </aside>
  );
}
