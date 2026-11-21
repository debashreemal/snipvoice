import React, { createContext, useContext, useState } from 'react';
import {
  INITIAL_PROJECTS,
  INITIAL_BRAND_VOICE,
  INITIAL_LEARNED_NOTES,
  INITIAL_EDITS,
  INITIAL_SCHEDULED_SLOTS,
  WEEK_DAYS,
  MOCK_PERFORMANCE_POSTS,
  generateAutoPlanSlots,
  generateCaptionsStateForClips,
  MOCK_CLIPS_D2C
} from '../data/mock';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Projects array in store
  const [projects, setProjects] = useState(INITIAL_PROJECTS);

  // Global Brand Voice profile
  const [brandVoice, setBrandVoice] = useState(INITIAL_BRAND_VOICE);

  // Global Learned Notes (shared across all projects)
  const [learnedNotes, setLearnedNotes] = useState(INITIAL_LEARNED_NOTES);
  const [recentlyAddedNotes, setRecentlyAddedNotes] = useState([]);

  // Global Edits history (stores project name and diffs)
  const [edits, setEdits] = useState(INITIAL_EDITS);

  // Global Scheduled Calendar Slots
  const [scheduledSlots, setScheduledSlots] = useState(INITIAL_SCHEDULED_SLOTS);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [hasAppliedInsights, setHasAppliedInsights] = useState(false);

  // Overrides for performance metrics (views, likes, hookType)
  const [postOverrides, setPostOverrides] = useState({});

  // Get project helper
  const getProject = (projectId) => {
    return projects.find((p) => p.id === projectId) || projects[0];
  };

  // Create a new project
  const createProject = ({ title, transcript }) => {
    const newId = `proj-${Date.now()}`;
    const newClips = MOCK_CLIPS_D2C.map((clip, idx) => ({
      ...clip,
      id: `${newId}-c${idx + 1}`,
      status: null
    }));

    const newProject = {
      id: newId,
      title: title && title.trim() ? title.trim() : 'Untitled Project',
      createdAt: 'Just now',
      transcript: transcript || '',
      clips: newClips,
      captionsState: generateCaptionsStateForClips(newClips, false),
      scheduledCount: 0,
      postedCount: 0
    };

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  // Toggle clip approval for a specific project
  const handleApprove = (projectIdOrClipId, clipIdMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdMaybe;

    // Handle single argument fallback
    if (!clipIdMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
    }

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === targetProjectId) {
          const updatedClips = project.clips.map((c) => {
            if (c.id === targetClipId) {
              const nextStatus = c.status === 'approved' ? null : 'approved';
              return { ...c, status: nextStatus };
            }
            return c;
          });
          return { ...project, clips: updatedClips };
        }
        return project;
      })
    );
  };

  // Toggle clip rejection for a specific project
  const handleReject = (projectIdOrClipId, clipIdMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdMaybe;

    if (!clipIdMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
    }

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === targetProjectId) {
          const updatedClips = project.clips.map((c) => {
            if (c.id === targetClipId) {
              const nextStatus = c.status === 'rejected' ? null : 'rejected';
              return { ...c, status: nextStatus };
            }
            return c;
          });
          return { ...project, clips: updatedClips };
        }
        return project;
      })
    );
  };

  // Get caption data for a project + clip + platform
  const getCaptionData = (projectIdOrClipId, clipIdOrPlatform, platformMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdOrPlatform;
    let targetPlatform = platformMaybe;

    // Handle 2 arguments fallback: (clipId, platform)
    if (!platformMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
      targetPlatform = clipIdOrPlatform;
    }

    const project = getProject(targetProjectId);
    const key = `${targetClipId}_${targetPlatform}`;
    return (
      project?.captionsState?.[key] || {
        text: '',
        original: '',
        voiceMatch: 58,
        isEdited: false
      }
    );
  };

  // Update caption text live as user edits
  const updateCaptionText = (projectIdOrClipId, clipIdOrPlatform, platformOrText, textMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdOrPlatform;
    let targetPlatform = platformOrText;
    let newText = textMaybe;

    if (textMaybe === undefined) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
      targetPlatform = clipIdOrPlatform;
      newText = platformOrText;
    }

    const key = `${targetClipId}_${targetPlatform}`;

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === targetProjectId) {
          const current = project.captionsState?.[key] || {
            text: '',
            original: '',
            voiceMatch: 58,
            isEdited: false
          };
          return {
            ...project,
            captionsState: {
              ...project.captionsState,
              [key]: {
                ...current,
                text: newText
              }
            }
          };
        }
        return project;
      })
    );
  };

  // Global learning rule engine when saving an edit
  const saveCaptionEdit = (projectIdOrClipId, clipIdOrPlatform, platformMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdOrPlatform;
    let targetPlatform = platformMaybe;

    if (!platformMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
      targetPlatform = clipIdOrPlatform;
    }

    const project = getProject(targetProjectId);
    const key = `${targetClipId}_${targetPlatform}`;
    const cardData = project?.captionsState?.[key];
    if (!cardData) return;

    const original = cardData.original;
    const edited = cardData.text;

    // Add to global edits history with project name
    const newEditRecord = {
      id: `edit-${Date.now()}-${Math.random()}`,
      projectId: project.id,
      projectName: project.title,
      clipId: targetClipId,
      platform: targetPlatform,
      original,
      edited,
      timestamp: 'Just now'
    };
    setEdits((prev) => [newEditRecord, ...prev]);

    // Rule Engine
    const detectedNotes = [];

    // Rule A: Emojis removed
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
    const origEmojis = original.match(emojiRegex) || [];
    const editEmojis = edited.match(emojiRegex) || [];
    if (origEmojis.length > 0 && editEmojis.length === 0) {
      detectedNotes.push('Removes emojis');
    }

    // Rule B: Edited text at least 30% shorter
    if (edited.trim().length > 0 && edited.trim().length <= original.trim().length * 0.7) {
      detectedNotes.push('Prefers short sentences');
    }

    // Rule C: Hashtags removed
    const hashRegex = /#\w+/g;
    const origHashes = original.match(hashRegex) || [];
    const editHashes = edited.match(hashRegex) || [];
    if (origHashes.length > 0 && editHashes.length === 0) {
      detectedNotes.push('Skips hashtags');
    }

    // Rule D: Words removed
    const trackedWords = ['amazing', 'unlock', 'hustle', 'viral', 'guru', 'guaranteed', 'synergy'];
    trackedWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(original) && !regex.test(edited)) {
        detectedNotes.push(`Avoids the word '${word}'`);
      }
    });

    // Update global learned notes (shared across all projects)
    setLearnedNotes((prev) => {
      const brandNew = detectedNotes.filter((note) => !prev.includes(note));
      if (brandNew.length > 0) {
        setRecentlyAddedNotes(brandNew);
        setTimeout(() => {
          setRecentlyAddedNotes([]);
        }, 1000);
        return [...prev, ...brandNew];
      }
      return prev;
    });

    // Mark caption as edited in project
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === targetProjectId) {
          return {
            ...proj,
            captionsState: {
              ...proj.captionsState,
              [key]: {
                ...proj.captionsState[key],
                isEdited: true,
                voiceMatch: 92
              }
            }
          };
        }
        return proj;
      })
    );
  };

  // Regenerate caption text
  const regenerateCaption = (projectIdOrClipId, clipIdOrPlatform, platformMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdOrPlatform;
    let targetPlatform = platformMaybe;

    if (!platformMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
      targetPlatform = clipIdOrPlatform;
    }

    const project = getProject(targetProjectId);
    const key = `${targetClipId}_${targetPlatform}`;
    const clip = project?.clips?.find((c) => c.id === targetClipId);
    const hookLine = clip ? clip.hookLine : 'Strong insight';

    const learnedVariation = `${hookLine} Directly delivering value without fluff or generic buzzwords.`;

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === targetProjectId) {
          return {
            ...proj,
            captionsState: {
              ...proj.captionsState,
              [key]: {
                ...proj.captionsState[key],
                text: learnedVariation,
                voiceMatch: 90,
                regeneratedAfterEdit: true
              }
            }
          };
        }
        return proj;
      })
    );
  };

  // Update Global Brand Voice Profile
  const updateBrandVoice = (newVoice) => {
    setBrandVoice((prev) => ({ ...prev, ...newVoice }));
  };

  // Auto-plan week slots with 1-second loading animation
  const autoPlanWeek = (projectId) => {
    const targetProject = projectId ? getProject(projectId) : projects[0];
    const approvedClips = targetProject?.clips?.filter((c) => c.status === 'approved') || [];
    if (approvedClips.length === 0) return;

    setIsAutoPlanning(true);
    setTimeout(() => {
      const slots = generateAutoPlanSlots(
        approvedClips,
        targetProject.id,
        targetProject.title,
        hasAppliedInsights
      );
      setScheduledSlots((prev) => [...slots, ...prev.filter((s) => s.projectId !== targetProject.id)]);
      setIsAutoPlanning(false);
    }, 1000);
  };

  // Update a single slot
  const updateSlot = (slotId, updates) => {
    setScheduledSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          const updated = { ...slot, ...updates };
          if (updates.day) {
            const dayObj = WEEK_DAYS.find((w) => w.key === updates.day);
            if (dayObj) {
              updated.date = dayObj.date;
              updated.dayNumber = dayObj.dayNumber;
            }
          }
          return updated;
        }
        return slot;
      })
    );
  };

  // Remove a slot
  const removeSlot = (slotId) => {
    setScheduledSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  // Mark slot as posted and immediately record its views/likes
  const markSlotPosted = (slotId, metrics) => {
    setScheduledSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, isPosted: true } : slot))
    );
    if (metrics) {
      setPostOverrides((prev) => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          views: Number(metrics.views) || 0,
          likes: Number(metrics.likes) || 0
        }
      }));
    }
  };

  // Populated scheduled slots ensuring projectName is always present
  const populatedScheduledSlots = scheduledSlots.map((slot) => ({
    ...slot,
    projectName: slot.projectName || projects.find((p) => p.id === slot.projectId)?.title || 'Project'
  }));

  // Performance Posts state derived from posted slots or default 6 mock posts
  const postedCalendarSlots = populatedScheduledSlots.filter((s) => s.isPosted);
  const isUsingSampleData = postedCalendarSlots.length === 0;

  const performancePosts = isUsingSampleData
    ? MOCK_PERFORMANCE_POSTS.map((p) => {
        const proj = projects.find((pr) => pr.id === p.projectId);
        return {
          ...p,
          projectName: p.projectName || proj?.title || 'Project',
          views: postOverrides[p.id]?.views ?? p.views,
          likes: postOverrides[p.id]?.likes ?? p.likes,
          hookType: postOverrides[p.id]?.hookType ?? p.hookType
        };
      })
    : postedCalendarSlots.map((s, idx) => {
        const defaultHookTypes = ['Question', 'Bold claim', 'Story', 'Stat'];
        const defaultViews = [84200, 41500, 28400, 32100, 92600, 24800];
        const defaultLikes = [6200, 2800, 1950, 2100, 7100, 1600];
        const proj = projects.find((pr) => pr.id === s.projectId);
        return {
          id: s.id,
          projectId: s.projectId,
          projectName: s.projectName || proj?.title || 'Project',
          hookLine: s.hookLine,
          platform: s.platform,
          platformName: s.platformName,
          hookType: postOverrides[s.id]?.hookType || defaultHookTypes[idx % defaultHookTypes.length],
          postTime: s.time,
          views: postOverrides[s.id]?.views ?? defaultViews[idx % defaultViews.length],
          likes: postOverrides[s.id]?.likes ?? defaultLikes[idx % defaultLikes.length]
        };
      });

  const updatePostMetric = (postId, field, value) => {
    setPostOverrides((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [field]: value
      }
    }));
  };

  // Apply performance insights to global Learned panel and mark hasAppliedInsights
  const applyPerformanceInsights = (notesToAdd) => {
    setHasAppliedInsights(true);
    setLearnedNotes((prev) => {
      const brandNew = notesToAdd.filter((n) => !prev.includes(n));
      if (brandNew.length > 0) {
        setRecentlyAddedNotes(brandNew);
        setTimeout(() => {
          setRecentlyAddedNotes([]);
        }, 1000);
        return [...prev, ...brandNew];
      }
      return prev;
    });
  };

  // Backward compatibility fallback accessors: aggregate all approved clips across projects
  const allApprovedClips = projects.flatMap((p) => p.clips?.filter((c) => c.status === 'approved') || []);
  const firstProject = projects[0] || {};
  const clips = firstProject.clips || [];
  const approvedClips = allApprovedClips;

  return (
    <AppContext.Provider
      value={{
        // Projects Store
        projects,
        getProject,
        createProject,
        // Clips within projects
        handleApprove,
        handleReject,
        // Captions within projects
        getCaptionData,
        updateCaptionText,
        saveCaptionEdit,
        regenerateCaption,
        // Global Brand Voice
        brandVoice,
        updateBrandVoice,
        // Global Learning & Edits
        learnedNotes,
        recentlyAddedNotes,
        edits,
        // Global Calendar
        scheduledSlots: populatedScheduledSlots,
        isAutoPlanning,
        hasAppliedInsights,
        autoPlanWeek,
        updateSlot,
        removeSlot,
        markSlotPosted,
        // Global Performance
        performancePosts,
        isUsingSampleData,
        updatePostMetric,
        applyPerformanceInsights,
        // Backward compatibility
        clips,
        approvedClips
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
