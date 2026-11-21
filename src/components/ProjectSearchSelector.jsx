import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, FolderKanban } from 'lucide-react';

// Searchable project selector with real-time text filter and clean design-system styling
export default function ProjectSearchSelector({
  projects = [],
  selectedProjectId = 'all',
  onSelectProject,
  placeholder = 'Type to search projects...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const isAllSelected = selectedProjectId === 'all' || !selectedProjectId;

  // Filter projects by typed search query
  const filteredProjects = projects.filter((p) =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleSelect = (id) => {
    onSelectProject(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectProject('all');
    setSearchTerm('');
  };

  return (
    <div className="project-search-selector-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`project-selector-trigger ${isOpen ? 'is-open' : ''} ${!isAllSelected ? 'has-selection' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <FolderKanban size={15} strokeWidth={2.4} className="selector-icon" />
        <span className="selector-label">Project:</span>
        <span
          className="selector-value"
          title={isAllSelected ? `All projects (${projects.length})` : activeProject?.title}
        >
          {isAllSelected ? `All projects (${projects.length})` : activeProject?.title || 'Selected project'}
        </span>

        {!isAllSelected && (
          <span
            className="selector-clear-btn"
            onClick={handleClear}
            title="Reset to all projects"
          >
            <X size={13} strokeWidth={2.6} />
          </span>
        )}

        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={`selector-chevron ${isOpen ? 'is-flipped' : ''}`}
        />
      </button>

      {/* Searchable Dropdown Menu */}
      {isOpen && (
        <div className="project-selector-dropdown">
          {/* Integrated Search Input */}
          <div className="selector-search-box">
            <Search size={14} strokeWidth={2.4} className="selector-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="selector-search-input"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="selector-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search query"
              >
                <X size={12} strokeWidth={2.6} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="selector-options-list" role="listbox">
            {/* All Projects Option */}
            <div
              className={`selector-option-item ${isAllSelected ? 'is-selected' : ''}`}
              onClick={() => handleSelect('all')}
              role="option"
              aria-selected={isAllSelected}
            >
              <div className="option-title-group">
                <span className="option-title">All projects</span>
                <span className="option-count">({projects.length})</span>
              </div>
              {isAllSelected && (
                <Check size={14} strokeWidth={2.8} className="option-check-icon" />
              )}
            </div>

            {/* Filtered Project Items */}
            {filteredProjects.length === 0 ? (
              <div className="selector-no-results">
                No projects matching &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = selectedProjectId === proj.id;
                const clipsCount = proj.clips?.length || 0;
                const approvedCount = proj.clips?.filter((c) => c.status === 'approved').length || 0;

                return (
                  <div
                    key={proj.id}
                    className={`selector-option-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(proj.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="option-info-group">
                      <span className="option-title" title={proj.title}>
                        {proj.title}
                      </span>
                      <span className="option-subtitle">
                        {approvedCount > 0 ? `${approvedCount} approved clips` : `${clipsCount} clips`}
                        {proj.createdAt ? ` · ${proj.createdAt}` : ''}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} strokeWidth={2.8} className="option-check-icon" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
