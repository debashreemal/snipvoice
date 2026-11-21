import React from 'react';

// Format number (e.g. 88400 -> "88.4k", 3200 -> "3.2k")
function formatViews(num) {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

// Flat HookBarChart: simple HTML divs, --sky-bright fill, --day-column track.
// Highest bar: --approve (#9EE2B5), Lowest bar: --reject (#F6A5A5).
export default function HookBarChart({ hookStats }) {
  // Find highest and lowest average views
  const validAvgs = hookStats.map((h) => h.avgViews);
  const maxViews = Math.max(...validAvgs, 1);
  const minViews = Math.min(...validAvgs);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Average views by hook type</h3>
      </div>

      <div className="chart-bars-list">
        {hookStats.map((item) => {
          const isHighest = item.avgViews === maxViews && maxViews > minViews;
          const isLowest = item.avgViews === minViews && maxViews > minViews;
          const barWidthPercent = Math.max(10, Math.round((item.avgViews / maxViews) * 100));

          // Bar color class: highest = approve, lowest = reject, other = default sky
          let barClass = 'bar-fill-default';
          if (isHighest) barClass = 'bar-fill-highest';
          else if (isLowest) barClass = 'bar-fill-lowest';

          return (
            <div key={item.type} className="chart-bar-row">
              {/* Hook type label */}
              <div className="chart-bar-label">
                <span className="hook-name">{item.type}</span>
              </div>

              {/* Progress track & fill */}
              <div className="chart-bar-track">
                <div
                  className={`chart-bar-fill ${barClass}`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Metric display formatted */}
              <div className="chart-bar-value">
                <span>{formatViews(item.avgViews)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
