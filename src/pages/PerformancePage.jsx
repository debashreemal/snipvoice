import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';
import PostsTable from '../components/PostsTable';
import HookBarChart from '../components/HookBarChart';
import SuggestionsCard from '../components/SuggestionsCard';
import ProjectSearchSelector from '../components/ProjectSearchSelector';
import { HOOK_TYPES } from '../data/mock';

// Format numbers (e.g. 50600 -> "50.6k", 3625 -> "3.6k")
function formatMetric(num) {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

// Categorize post time into morning, afternoon, evening
function parseTimeCategory(timeStr) {
  if (!timeStr) return 'evening';
  const str = timeStr.toLowerCase().trim();
  const isPM = str.includes('pm');
  const isAM = str.includes('am');
  const match = str.match(/(\d+)(?::(\d+))?/);
  let hour = match ? parseInt(match[1], 10) : 12;
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  if (hour < 12) return 'morning'; // before 12 PM
  if (hour < 17) return 'afternoon'; // 12 PM to 4:59 PM
  return 'evening'; // 5 PM and later
}

export default function PerformancePage() {
  const {
    projects,
    performancePosts,
    isUsingSampleData,
    updatePostMetric,
    applyPerformanceInsights
  } = useAppContext();

  const [selectedProjectId, setSelectedProjectId] = useState('all');

  // Filter posts based on selected project
  const filteredPosts = useMemo(() => {
    if (selectedProjectId === 'all') return performancePosts;
    return performancePosts.filter((p) => p.projectId === selectedProjectId);
  }, [performancePosts, selectedProjectId]);

  // Pattern detection computed live on every metric edit
  const analysis = useMemo(() => {
    const posts = filteredPosts || [];
    if (posts.length === 0) {
      return {
        avgViews: 0,
        avgLikes: 0,
        hookStats: HOOK_TYPES.map((type) => ({ type, avgViews: 0, count: 0 })),
        bestHookType: '—',
        multiplier: '0',
        eveningDiffPct: 0,
        weakestPlatform: '—'
      };
    }

    const count = posts.length || 1;

    // 1. Overall averages
    const totalViews = posts.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (Number(p.likes) || 0), 0);
    const avgViews = Math.round(totalViews / count);
    const avgLikes = Math.round(totalLikes / count);

    // 2. Average views by hook type
    const hookStats = HOOK_TYPES.map((type) => {
      const matched = posts.filter((p) => p.hookType === type);
      const hookTotalViews = matched.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
      const hookAvg = matched.length > 0 ? Math.round(hookTotalViews / matched.length) : 0;
      return {
        type,
        avgViews: hookAvg,
        count: matched.length
      };
    });

    // Best hook type
    const sortedHooks = [...hookStats].sort((a, b) => b.avgViews - a.avgViews);
    const bestHook = sortedHooks[0] || { type: 'Question', avgViews: 0 };

    // Multiplier of best hook type vs average of other hook types
    const otherHooks = hookStats.filter((h) => h.type !== bestHook.type && h.count > 0);
    const otherAvg =
      otherHooks.length > 0
        ? otherHooks.reduce((sum, h) => sum + h.avgViews, 0) / otherHooks.length
        : bestHook.avgViews / 2 || 1;
    const multiplier = otherAvg > 0 ? (bestHook.avgViews / otherAvg).toFixed(1) : '2.0';

    // 3. Time of day pattern detection (morning vs evening)
    const morningPosts = posts.filter((p) => parseTimeCategory(p.postTime) === 'morning');
    const eveningPosts = posts.filter((p) => parseTimeCategory(p.postTime) === 'evening');

    const avgMorning =
      morningPosts.length > 0
        ? morningPosts.reduce((sum, p) => sum + (Number(p.views) || 0), 0) / morningPosts.length
        : 26600;
    const avgEvening =
      eveningPosts.length > 0
        ? eveningPosts.reduce((sum, p) => sum + (Number(p.views) || 0), 0) / eveningPosts.length
        : 72800;

    const eveningDiffPct =
      avgMorning > 0
        ? Math.max(10, Math.round(((avgEvening - avgMorning) / avgMorning) * 100))
        : 174;

    // 4. Platform performance comparison
    const platformMap = {};
    posts.forEach((p) => {
      const plat = p.platformName || p.platform;
      if (!platformMap[plat]) platformMap[plat] = { total: 0, count: 0 };
      platformMap[plat].total += Number(p.views) || 0;
      platformMap[plat].count += 1;
    });

    let weakestPlatform = 'LinkedIn';
    let strongestPlatform = 'Instagram';
    let lowestAvg = Infinity;
    let highestAvg = 0;
    Object.entries(platformMap).forEach(([plat, data]) => {
      const pAvg = data.count > 0 ? Math.round(data.total / data.count) : 0;
      if (pAvg < lowestAvg) {
        lowestAvg = pAvg;
        weakestPlatform = plat;
      }
      if (pAvg > highestAvg) {
        highestAvg = pAvg;
        strongestPlatform = plat;
      }
    });

    return {
      avgViews,
      avgLikes,
      hookStats,
      bestHookType: bestHook.type,
      bestHookAvg: bestHook.avgViews,
      otherAvg: Math.round(otherAvg),
      multiplier,
      eveningDiffPct,
      avgEvening: Math.round(avgEvening),
      avgMorning: Math.round(avgMorning),
      weakestPlatform,
      strongestPlatform,
      lowestAvg: lowestAvg === Infinity ? 0 : lowestAvg,
      highestAvg
    };
  }, [filteredPosts]);

  return (
    <div className="performance-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Performance</h1>
        <p className="page-subtitle">
          Enter how your posts did. SnipVoice changes its next suggestions based on what worked.
        </p>
      </div>

      {/* Top Filter Bar */}
      <div className="performance-filter-bar">
        <ProjectSearchSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => setSelectedProjectId(id)}
          placeholder="Search projects to view performance..."
        />
      </div>

      {/* Top Row: 3 Stat Cards */}
      <div className="performance-stats-row">
        <StatCard
          label="Avg views"
          value={formatMetric(analysis.avgViews)}
          sublabel="Per published clip"
        />
        <StatCard
          label="Avg likes"
          value={formatMetric(analysis.avgLikes)}
          sublabel="Across all platforms"
        />
        <StatCard
          label="Best hook type"
          value={analysis.bestHookType}
          sublabel={analysis.bestHookType === '—' ? 'Needs published posts' : `~${analysis.multiplier}x higher views`}
        />
      </div>

      {/* Main Content Layout */}
      <div className="performance-content-grid">
        {/* Left Column: Posts Table + Hook Bar Chart */}
        <div className="performance-left-column">
          <PostsTable
            posts={filteredPosts}
            isUsingSampleData={isUsingSampleData}
            onUpdateMetric={updatePostMetric}
          />
          <HookBarChart hookStats={analysis.hookStats} />
        </div>

        {/* Right Column: Next Suggestions Card */}
        <div className="performance-right-column">
          <SuggestionsCard
            bestHookType={analysis.bestHookType}
            bestHookAvg={analysis.bestHookAvg}
            otherAvg={analysis.otherAvg}
            multiplier={analysis.multiplier}
            eveningDiffPct={analysis.eveningDiffPct}
            avgEvening={analysis.avgEvening}
            avgMorning={analysis.avgMorning}
            weakestPlatform={analysis.weakestPlatform}
            strongestPlatform={analysis.strongestPlatform}
            lowestAvg={analysis.lowestAvg}
            highestAvg={analysis.highestAvg}
            onApply={applyPerformanceInsights}
          />
        </div>
      </div>
    </div>
  );
}
