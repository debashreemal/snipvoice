import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
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

  // Fetch persisted projects, brand voice, notes, and edits from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    apiFetch('/api/projects')
      .then((data) => {
        if (!isMounted || !data) return;
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        }
        if (data.brandVoice) {
          setBrandVoice((prev) => ({
            ...prev,
            tone: data.brandVoice.tone || prev.tone || 'Direct & conversational',
            wordsIUse: (data.brandVoice.wordsIUse && data.brandVoice.wordsIUse.trim().length > 0)
              ? data.brandVoice.wordsIUse
              : (prev.wordsIUse || 'Jugaad, Hustle, Organic reach, Relatable, Bharat, Consistency, Ground reality'),
            wordsIAvoid: (data.brandVoice.wordsIAvoid && data.brandVoice.wordsIAvoid.trim().length > 0)
              ? data.brandVoice.wordsIAvoid
              : (prev.wordsIAvoid || 'Viral hack, Synergy, Guru, Guaranteed, 10x growth, Passive income'),
          }));
        }
        if (Array.isArray(data.learnedNotes) && data.learnedNotes.length > 0) {
          setLearnedNotes(data.learnedNotes);
        }
        if (Array.isArray(data.edits) && data.edits.length > 0) {
          setEdits(data.edits);
        }
      })
      .catch((err) => {
        console.warn('Could not load existing projects from Supabase:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Get project helper
  const getProject = (projectId) => {
    return projects.find((p) => p.id === projectId) || projects[0];
  };

  // Create a new project (client fallback)
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

  // Add a project created via backend /api/pick-clips
  const addRealProject = ({ project, clips }) => {
    const parseSec = (t) => {
      if (!t) return 0;
      const parts = String(t).replace(/[\[\]]/g, '').trim().split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return 0;
    };

    const formattedClips = (clips || []).map((c) => {
      let durationStr = '45 sec';
      if (c.start_time && c.end_time) {
        const diff = parseSec(c.end_time) - parseSec(c.start_time);
        if (diff > 0) durationStr = `${diff} sec`;
      } else if (c.duration) {
        durationStr = c.duration;
      }

      return {
        id: c.id,
        project_id: project.id,
        timeRange: c.timeRange || `${c.start_time} - ${c.end_time}`,
        duration: durationStr,
        hookLine: c.hook || c.hookLine || '',
        hookType: c.hook_type || c.hookType || 'Bold claim',
        reason: c.reason || '',
        score: typeof c.score === 'number' ? c.score : (parseInt(c.score, 10) || 85),
        status: null // starts as null, creator clicks Approve / Reject
      };
    });

    const newProject = {
      id: project.id,
      title: project.title || 'Untitled Project',
      createdAt: 'Just now',
      transcript: project.transcript || '',
      clips: formattedClips,
      captionsState: {},
      scheduledCount: 0,
      postedCount: 0,
      status: project.status || 'clips_pending'
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

    let nextStatus = 'approved';
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === targetProjectId) {
          const updatedClips = project.clips.map((c) => {
            if (c.id === targetClipId) {
              nextStatus = c.status === 'approved' ? 'pending' : 'approved';
              return { ...c, status: nextStatus === 'pending' ? null : nextStatus };
            }
            return c;
          });
          return { ...project, clips: updatedClips };
        }
        return project;
      })
    );

    // Persist status to Supabase in background
    apiFetch('/api/update-clip-status', {
      method: 'POST',
      body: { clipId: targetClipId, status: nextStatus },
    }).catch((err) => console.warn('Could not update clip status in Supabase:', err));
  };

  // Toggle clip rejection for a specific project
  const handleReject = (projectIdOrClipId, clipIdMaybe) => {
    let targetProjectId = projectIdOrClipId;
    let targetClipId = clipIdMaybe;

    if (!clipIdMaybe) {
      targetProjectId = projects[0]?.id;
      targetClipId = projectIdOrClipId;
    }

    let nextStatus = 'rejected';
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === targetProjectId) {
          const updatedClips = project.clips.map((c) => {
            if (c.id === targetClipId) {
              nextStatus = c.status === 'rejected' ? 'pending' : 'rejected';
              return { ...c, status: nextStatus === 'pending' ? null : nextStatus };
            }
            return c;
          });
          return { ...project, clips: updatedClips };
        }
        return project;
      })
    );

    // Persist status to Supabase in background
    apiFetch('/api/update-clip-status', {
      method: 'POST',
      body: { clipId: targetClipId, status: nextStatus },
    }).catch((err) => console.warn('Could not update clip status in Supabase:', err));
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
    const platKey = String(targetPlatform || '').toLowerCase();
    const key = `${targetClipId}_${platKey}`;
    return (
      project?.captionsState?.[key] || {
        text: '',
        original: '',
        voiceMatch: null,
        isEdited: false
      }
    );
  };

  // Set all captions for a clip (e.g. from /api/captions response or database)
  const setClipCaptions = (projectId, clipId, captionsList) => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const updatedState = { ...(project.captionsState || {}) };
          for (const item of captionsList) {
            const platKey = String(item.platform || '').toLowerCase();
            const key = `${clipId}_${platKey}`;
            const existing = updatedState[key];
            updatedState[key] = {
              id: item.id || existing?.id,
              text: item.text,
              original: item.original || item.text,
              voiceMatch: item.voice_match !== undefined ? item.voice_match : (item.voiceMatch !== undefined ? item.voiceMatch : null),
              isEdited: Boolean(item.isEdited),
            };
          }
          return { ...project, captionsState: updatedState };
        }
        return project;
      })
    );
  };

  // Update a single platform caption (e.g. on Regenerate)
  const updateSingleCaption = (projectId, clipId, platform, newText, newVoiceMatch, newId) => {
    const platKey = String(platform || '').toLowerCase();
    const key = `${clipId}_${platKey}`;
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const existing = project.captionsState?.[key] || {};
          const updatedState = {
            ...(project.captionsState || {}),
            [key]: {
              ...existing,
              id: newId || existing.id,
              text: newText,
              original: newText,
              voiceMatch: newVoiceMatch !== undefined ? newVoiceMatch : null,
              isEdited: false, // reset edited flag on fresh regeneration
            },
          };
          return { ...project, captionsState: updatedState };
        }
        return project;
      })
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

    // Persist edit and learned notes to Supabase in background
    apiFetch('/api/save-edit', {
      method: 'POST',
      body: {
        projectId: project.id,
        clipId: targetClipId,
        platform: targetPlatform,
        originalText: original,
        editedText: edited,
        detectedNotes,
      },
    }).catch((err) => console.warn('Could not save edit to Supabase:', err));
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
    apiFetch('/api/brand-voice', {
      method: 'POST',
      body: newVoice,
    }).catch((err) => console.warn('Could not update brand voice in Supabase:', err));
  };

  // Auto-plan week slots (supports immediate mode for Send to Calendar)
  const autoPlanWeek = (projectId, immediate = false) => {
    const targetProject = projectId ? getProject(projectId) : projects[0];
    let approvedClips = targetProject?.clips?.filter((c) => c.status === 'approved') || [];

    // Fallback: If no clips explicitly marked approved yet, use top clips from project or mock clips
    if (approvedClips.length === 0) {
      if (targetProject?.clips && targetProject.clips.length > 0) {
        approvedClips = targetProject.clips.slice(0, 5);
      } else {
        approvedClips = MOCK_CLIPS_D2C;
      }
    }

    const slots = generateAutoPlanSlots(
      approvedClips,
      targetProject?.id || 'proj-1',
      targetProject?.title || 'D2C Brand Secrets',
      hasAppliedInsights
    );

    if (immediate) {
      setScheduledSlots((prev) => [...slots, ...prev.filter((s) => s.projectId !== (targetProject?.id || 'proj-1'))]);
      return slots;
    }

    setIsAutoPlanning(true);
    setTimeout(() => {
      setScheduledSlots((prev) => [...slots, ...prev.filter((s) => s.projectId !== (targetProject?.id || 'proj-1'))]);
      setIsAutoPlanning(false);
    }, 600);
    return slots;
  };

  // Add a single slot manually or from clip selector
  const addSlot = (newSlot) => {
    setScheduledSlots((prev) => [newSlot, ...prev]);
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

  // Performance Posts state derived strictly from posted calendar slots
  const postedCalendarSlots = populatedScheduledSlots.filter((s) => s.isPosted);
  const isUsingSampleData = false;

  const performancePosts = postedCalendarSlots.map((s, idx) => {
    const defaultHookTypes = ['Question', 'Bold claim', 'Story', 'Stat'];
    const defaultViews = [1200, 3400, 850, 4200, 5600, 2100];
    const defaultLikes = [95, 240, 60, 310, 430, 180];
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
        addRealProject,
        // Clips within projects
        handleApprove,
        handleReject,
        // Captions within projects
        getCaptionData,
        updateCaptionText,
        setClipCaptions,
        updateSingleCaption,
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
        addSlot,
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
